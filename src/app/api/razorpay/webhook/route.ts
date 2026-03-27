
import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma/client";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ message: "No signature" }, { status: 401 });
        }

        // 1. Verify Signature
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
            .update(body)
            .digest("hex");

        if (signature !== expectedSignature) {
            console.error("Signature Mismatch");
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);
        const { payload, event: eventType } = event;

        console.log(`Razorpay Webhook: ${eventType}`);

        // 2. Handle Events
        switch (eventType) {
            case "subscription.authenticated":
            case "subscription.activated": {
                const rSub = payload.subscription.entity;
                const userId = rSub.notes.userId;

                // Sync status and period in DB
                const expiresAt = new Date(rSub.end_at * 1000); // end_at is in seconds

                await prisma.$transaction([
                    // Update main user plan info
                    prisma.user.update({
                        where: { id: userId },
                        data: {
                            plan: "PRO_RECURRING",
                            planExpiresAt: expiresAt,
                        },
                    }),
                    // Update subscription record
                    prisma.subscription.update({
                        where: { razorpaySubscriptionId: rSub.id },
                        data: {
                            status: "ACTIVE",
                            currentPeriodEnd: expiresAt,
                            expiresAt: expiresAt,
                        },
                    }),
                ]);
                break;
            }

            case "subscription.charged": {
                const rPayment = payload.payment.entity;
                const rSub = payload.subscription.entity;

                // Mark as charged and maybe log payment records
                await prisma.subscription.update({
                    where: { razorpaySubscriptionId: rSub.id },
                    data: {
                        amountPaise: rPayment.amount,
                        razorpayPaymentId: rPayment.id,
                        status: "ACTIVE",
                    },
                });
                break;
            }

            case "subscription.cancelled": {
                const rSub = payload.subscription.entity;
                await prisma.user.update({
                    where: { id: rSub.notes.userId },
                    data: { plan: "FREE" },
                });
                await prisma.subscription.update({
                    where: { razorpaySubscriptionId: rSub.id },
                    data: { status: "CANCELLED" },
                });
                break;
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
