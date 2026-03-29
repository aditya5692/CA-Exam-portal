import { Footer } from "@/components/common/footer";
import { Navbar } from "@/components/common/navbar";
import { getSessionPayload } from "@/lib/auth/session";

export default async function FooterPagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSessionPayload();

    return (
        <div className="min-h-screen bg-[var(--landing-bg)] text-[var(--landing-text)] selection:bg-[var(--landing-selection-bg)] selection:text-[var(--landing-accent)]">
            <Navbar user={session} />
            <main className="mx-auto w-full max-w-7xl px-6 pb-20 pt-28 sm:px-12 sm:pt-32">
                {children}
            </main>
            <Footer />
        </div>
    );
}
