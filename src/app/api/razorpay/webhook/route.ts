import { resolvePlanEntitlement } from "@/lib/server/plan-entitlements";
import { verifyWebhookSignature } from "@/lib/server/razorpay";
import { revalidatePlanSurfaces } from "@/lib/server/revalidation";
import prisma from "@/lib/prisma/client";
import { NextResponse } from "next/server";

type RazorpayPayloadEntity = Record<string, unknown> | undefined;
type UserWriteClient = Pick<typeof prisma, "user">;
type RazorpayPaymentEntity = {
    order_id?: string;
    subscription_id?: string;
    amount?: number;
    id?: string;
};
type RazorpaySubscriptionEntity = {
    id?: string;
    current_end?: number;
    end_at?: number;
};

function fromUnixTimestamp(value: number | null | undefined) {
    if (!value || Number.isNaN(value)) {
        return null;
    }

    return new Date(value * 1000);
}

async function applyUserPlanState(tx: UserWriteClient, input: {
    userId: string;
    plan: string;
    role: string;
    expiresAt: Date | null;
}) {
    const user = await tx.user.findUnique({
        where: { id: input.userId },
        select: { storageLimit: true },
    });

    if (!user) {
        return;
    }

    const entitlement = resolvePlanEntitlement(input.plan, input.role);
    await tx.user.update({
        where: { id: input.userId },
        data: {
            plan: input.plan,
            planExpiresAt: input.expiresAt,
            storageLimit: Math.max(user.storageLimit, entitlement.storageLimitFloor),
        },
    });
}

async function downgradeUserToFree(tx: UserWriteClient, userId: string) {
    await tx.user.update({
        where: { id: userId },
        data: {
            plan: "FREE",
            planExpiresAt: null,
        },
    });
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ message: "Missing Razorpay signature." }, { status: 401 });
        }

        if (!(await verifyWebhookSignature(rawBody, signature))) {
            return NextResponse.json({ message: "Invalid Razorpay signature." }, { status: 400 });
        }

        const event = JSON.parse(rawBody);
        const eventId = event.id as string;
        const eventType = event.event as string;

        if (!eventId) {
            return NextResponse.json({ message: "Missing event ID." }, { status: 400 });
        }

        // Idempotency: Check if we already processed this event
        const existingEvent = await (prisma as any).webhookEvent.findUnique({
            where: { eventId: eventId },
        });

        if (existingEvent) {
            console.log(`[Webhook] Event ${eventId} already processed (idempotent).`);
            return NextResponse.json({ status: "ok", handled: "idempotent" });
        }

        const payload = event.payload as Record<string, RazorpayPayloadEntity>;
        const subscriptionEntity = payload?.subscription?.entity as RazorpaySubscriptionEntity | undefined;
        const paymentEntity = payload?.payment?.entity as RazorpayPaymentEntity | undefined;

        await prisma.$transaction(async (tx) => {
            // Mark event as processed within the transaction
            await (tx as any).webhookEvent.create({
                data: {
                    eventId: eventId,
                    type: "razorpay",
                    eventName: eventType,
                    payload: event,
                },
            });

            switch (eventType) {
                case "payment.captured": {
                    const orderId = paymentEntity?.order_id;
                    if (!orderId) break;

                    const subscription = await tx.subscription.findFirst({
                        where: { razorpayOrderId: orderId },
                    });
                    if (!subscription) break;

                    const amountMatches =
                        typeof paymentEntity?.amount !== "number" ||
                        paymentEntity.amount === subscription.amountPaise;
                    if (!amountMatches) break;

                    await tx.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            status: "ACTIVE",
                            amountPaise: paymentEntity?.amount ?? subscription.amountPaise,
                            razorpayPaymentId: paymentEntity?.id ?? subscription.razorpayPaymentId,
                            currentPeriodEnd: subscription.currentPeriodEnd ?? subscription.expiresAt,
                            expiresAt: subscription.currentPeriodEnd ?? subscription.expiresAt,
                            cancelAtPeriodEnd: false,
                        },
                    });

                    await applyUserPlanState(tx, {
                        userId: subscription.userId,
                        plan: subscription.plan,
                        role: subscription.role,
                        expiresAt: subscription.currentPeriodEnd ?? subscription.expiresAt,
                    });
                    break;
                }

                case "payment.failed": {
                    const subscription = paymentEntity?.subscription_id
                        ? await tx.subscription.findFirst({
                            where: { razorpaySubscriptionId: paymentEntity.subscription_id },
                        })
                        : paymentEntity?.order_id
                            ? await tx.subscription.findFirst({
                                where: { razorpayOrderId: paymentEntity.order_id },
                            })
                            : null;

                    if (!subscription) break;

                    const expiry = subscription.currentPeriodEnd ?? subscription.expiresAt;

                    await tx.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            status: "FAILED",
                            amountPaise: paymentEntity?.amount ?? subscription.amountPaise,
                            razorpayPaymentId: paymentEntity?.id ?? subscription.razorpayPaymentId,
                            currentPeriodEnd: expiry,
                            expiresAt: expiry,
                        },
                    });

                    if (expiry > new Date()) {
                        await applyUserPlanState(tx, {
                            userId: subscription.userId,
                            plan: subscription.plan,
                            role: subscription.role,
                            expiresAt: expiry,
                        });
                    } else {
                        await downgradeUserToFree(tx, subscription.userId);
                    }
                    break;
                }

                case "subscription.authenticated":
                case "subscription.activated":
                case "subscription.charged": {
                    const subscriptionId = subscriptionEntity?.id;
                    if (!subscriptionId) break;

                    const subscription = await tx.subscription.findFirst({
                        where: { razorpaySubscriptionId: subscriptionId },
                    });
                    if (!subscription) break;

                    const currentPeriodEnd = fromUnixTimestamp(
                        subscriptionEntity?.current_end ?? subscriptionEntity?.end_at,
                    ) ?? subscription.currentPeriodEnd ?? subscription.expiresAt;

                    await tx.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            status: "ACTIVE",
                            amountPaise: paymentEntity?.amount ?? subscription.amountPaise,
                            razorpayPaymentId: paymentEntity?.id ?? subscription.razorpayPaymentId,
                            currentPeriodEnd,
                            expiresAt: currentPeriodEnd,
                            cancelAtPeriodEnd: false,
                        },
                    });

                    await applyUserPlanState(tx, {
                        userId: subscription.userId,
                        plan: subscription.plan,
                        role: subscription.role,
                        expiresAt: currentPeriodEnd,
                    });
                    break;
                }

                case "subscription.cancelled":
                case "subscription.completed": {
                    const subscriptionId = subscriptionEntity?.id;
                    if (!subscriptionId) break;

                    const subscription = await tx.subscription.findFirst({
                        where: { razorpaySubscriptionId: subscriptionId },
                    });
                    if (!subscription) break;

                    const currentPeriodEnd = fromUnixTimestamp(
                        subscriptionEntity?.current_end ?? subscriptionEntity?.end_at,
                    ) ?? subscription.currentPeriodEnd ?? subscription.expiresAt;
                    const retainAccessUntilPeriodEnd = currentPeriodEnd > new Date();

                    await tx.subscription.update({
                        where: { id: subscription.id },
                        data: {
                            status: "CANCELLED",
                            cancelAtPeriodEnd: retainAccessUntilPeriodEnd,
                            currentPeriodEnd,
                            expiresAt: currentPeriodEnd,
                        },
                    });

                    if (retainAccessUntilPeriodEnd) {
                        await applyUserPlanState(tx, {
                            userId: subscription.userId,
                            plan: subscription.plan,
                            role: subscription.role,
                            expiresAt: currentPeriodEnd,
                        });
                    } else {
                        await downgradeUserToFree(tx, subscription.userId);
                    }
                    break;
                }

                default:
                    break;
            }
        });

        // Trigger cache revalidation if relevant events occurred
        if (eventType.startsWith("subscription.") || eventType === "payment.captured") {
            revalidatePlanSurfaces();
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: unknown) {
        console.error("Webhook Error:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Webhook processing failed." },
            { status: 500 },
        );
    }
}
