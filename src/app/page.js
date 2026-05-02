import HeroCarousel from "@/components/HeroCarousel";
import Marquee from "@/components/Marquee";
import ProductCard from "@/components/ProductCard";
import StatsCounter from "@/components/StatsCounter";
import { getCollections, getNewSaleProducts, getReviews } from "@/lib/catalog-store";
import Link from "next/link";

export const revalidate = 60; // Revalidate cache every 60 seconds

const trustItems = [
  "Designed & Manufactured",
  "No Middlemen",
  "Premium Quality Fabrics",
  "20+ Years of Expertise",
  "Custom Stitching Available",
];

export default async function Home() {
  const [collections, reviews, newSaleProducts] = await Promise.all([
    getCollections(),
    getReviews(),
    getNewSaleProducts(20),
  ]);

  return (
    <>
      <main className="bg-[#f4f4f4] text-[#241f20]">
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <HeroCarousel />
        </div>

        <div className="border-b border-[#ead8b7] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Marquee items={trustItems} />
        </div>

        <section className="bg-white py-16 sm:py-20 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col items-center text-center">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d8a734]">
                Browse by mood
              </p>
              <h2 className="text-3xl font-black tracking-wide text-[#241f20] sm:text-4xl">
                The Collections
              </h2>
              <div className="mt-3 h-[2px] w-12 bg-[#d8a734]" />
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {collections.map((collection) => (
                <Link
                  key={collection.slug}
                  href={`/products?collection=${collection.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-[8px] bg-[#5f0015]"
                >
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.name}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-85"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#5f0015]/90 via-[#5f0015]/30 to-transparent transition-opacity duration-500 group-hover:opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-col items-center p-4 sm:p-8 text-center text-white transition-transform duration-500 group-hover:-translate-y-2">
                    <h3 className="text-xl sm:text-3xl font-black tracking-wide">{collection.name}</h3>
                    <p className="mt-2 sm:mt-4 text-xs sm:text-sm font-normal leading-relaxed text-[#f6e7c3] opacity-0 transition-opacity duration-500 group-hover:opacity-100 hidden sm:block">
                      {collection.description}
                    </p>
                    <span className="mt-3 sm:mt-6 inline-block border-b border-[#d8a734] pb-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] text-[#d8a734]">
                      Explore
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="new-sales" className="border-t border-[#ead8b7] mx-auto max-w-[1600px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="mb-10 flex flex-col items-center text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#d8a734]">
              Fresh from the showroom
            </p>
            <h2 className="text-3xl font-black tracking-wide text-[#241f20] sm:text-4xl">
              New Arrivals
            </h2>
            <div className="mt-3 h-[2px] w-12 bg-[#d8a734]" />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {newSaleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/products"
              className="group relative flex items-center gap-2 rounded-full border border-[#d8a734] bg-white px-8 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-[#8b001c] transition-all hover:bg-[#fff4b8] hover:shadow-sm"
            >
              View All Products
            </Link>
          </div>
        </section>

        <section className="bg-[#eeeeee] py-12 sm:py-16 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="mx-auto max-w-[1600px] px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black tracking-wide text-[#241f20] sm:text-4xl">Testimonial</h2>
            <div className="mx-auto mt-3 h-[2px] w-12 bg-[#d8a734]" />
          </div>
          <div className="mt-8">
            <Marquee items={reviews} variant="reviews" />
          </div>
        </section>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <StatsCounter />
        </div>
      </main>
    </>
  );
}
