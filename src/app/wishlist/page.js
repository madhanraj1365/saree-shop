import WishlistClient from "@/components/WishlistClient";

export const metadata = {
  title: "My Wishlist | SMS Tex Elampillai",
};

export default function WishlistPage() {
  return (
    <>
      <main className="min-h-screen bg-white">
        <section className="border-b border-[#ead8b7] bg-[#f4f4f4] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d8a734]">
              Saved for later
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-wide text-[#241f20] sm:text-5xl">
              Your Wishlist
            </h1>
            <div className="mx-auto mt-4 h-[2px] w-12 bg-[#d8a734]" />
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5c4d43]">
              Pieces you love, saved for when you&apos;re ready to drape.
            </p>
          </div>
        </section>
        
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 mb-16">
          <WishlistClient />
        </section>
      </main>
    </>
  );
}
