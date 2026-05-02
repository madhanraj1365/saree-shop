import Link from "next/link";
import ProductActions from "@/components/ProductActions";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import ProductHeaderActions from "@/components/ProductHeaderActions";
import ExpandableDescription from "@/components/ExpandableDescription";
import { formatPrice } from "@/lib/catalog";
import { getProductBySlug, getProducts, getRelatedProducts, getCollections } from "@/lib/catalog-store";
import { notFound } from "next/navigation";

export const revalidate = 60; // Revalidate cache every 60 seconds

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return {
    title: product ? `${product.name} | SMS Tex Elampillai` : "Product | SMS Tex Elampillai",
    description: product?.description,
  };
}

function getDisplayPricing(price) {
  const originalPrice = Math.ceil(price / 0.83 / 10) * 10;
  return { originalPrice };
}

function formatCollectionName(slug) {
  return slug?.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || "Collection";
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  
  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product);
  const collections = await getCollections();
  const { originalPrice } = getDisplayPricing(product.price);

  return (
    <>
      <main className="min-h-screen bg-white pb-20">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
          
          <div className="grid lg:grid-cols-[280px_1fr] gap-10">
            {/* Left Sidebar */}
            <aside className="hidden lg:block space-y-10">
              {/* Category List */}
              <div className="border border-[#f0f0f0] p-6 shadow-sm">
                <h3 className="mb-6 font-serif text-lg font-bold uppercase tracking-widest text-[#241f20]">
                  Category
                </h3>
                <ul className="max-h-[300px] space-y-4 overflow-y-auto pr-2 text-sm text-[#5c4d43]">
                  <li>
                    <Link href="/products" className="hover:text-[#d8a734] transition-colors">
                      All Categories
                    </Link>
                  </li>
                  {collections.map((col) => (
                    <li key={col.slug}>
                      <Link href={`/collections/${col.slug}`} className="hover:text-[#d8a734] transition-colors">
                        {col.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature Blocks */}
              <div className="space-y-6 border border-[#f0f0f0] p-6 shadow-sm">
                <div className="flex items-start gap-4 pb-6 border-b border-[#f0f0f0] last:border-0 last:pb-0">
                  <svg className="h-8 w-8 shrink-0 text-[#d8a734]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#241f20]">Free Shipping</h4>
                    <p className="mt-1 text-xs text-[#5c4d43]">Worldwide Shipping Available</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 pb-6 border-b border-[#f0f0f0] last:border-0 last:pb-0">
                  <svg className="h-8 w-8 shrink-0 text-[#d8a734]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#241f20]">24/7 Service</h4>
                    <p className="mt-1 text-xs text-[#5c4d43]">Dedicated Customer Support</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-6 border-b border-[#f0f0f0] last:border-0 last:pb-0">
                  <svg className="h-8 w-8 shrink-0 text-[#d8a734]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
                  </svg>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#241f20]">Festival Offers</h4>
                    <p className="mt-1 text-xs text-[#5c4d43]">New Online Special Offers</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 pb-6 border-b border-[#f0f0f0] last:border-0 last:pb-0">
                   <svg className="h-8 w-8 shrink-0 text-[#d8a734]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-[#241f20]">Secure Payments</h4>
                    <p className="mt-1 text-xs text-[#5c4d43]">100% Secure Payment Gateways</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Product Area */}
            <div className="flex flex-col">
              <div className="mb-6">
                <Link 
                  href="/products" 
                  className="inline-flex items-center gap-2 rounded bg-[#d8a734] px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-[#c4962d]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Products
                </Link>
              </div>

              <div className="grid items-start gap-6 lg:gap-8 md:grid-cols-2">
                <ProductGallery images={product.images} name={product.name} />

                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="w-full">
                      <p className="mb-2 text-[12px] font-bold uppercase tracking-widest text-[#d8a734]">
                        {formatCollectionName(product.collection)}
                      </p>
                      <h1 className="text-2xl font-normal text-[#241f20] lg:text-3xl">
                        {product.name}
                      </h1>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-end gap-3">
                    <span className="text-3xl font-serif text-[#d8a734]">{formatPrice(product.price)}</span>
                    <span className="mb-1 text-lg text-[#8b8b8b] line-through">{formatPrice(originalPrice)}</span>
                  </div>

                  <div className="my-5 h-[1px] w-full bg-[#f0f0f0]" />

                  {/* Size Selection */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#241f20]">Select Size</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <button className="rounded border border-[#333333] bg-[#333333] px-6 py-2 text-sm font-bold text-white">
                        Free Size
                      </button>
                      <ProductHeaderActions product={product} />
                    </div>
                  </div>

                  {/* Stock Status */}
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#32b54a]">
                    <span className="h-2 w-2 rounded-full bg-[#32b54a]" />
                    In Stock ({product.stock} available)
                  </div>

                  <ProductActions product={product} />

                  <ExpandableDescription text={product.description} />
                  
                  <div className="mt-6 rounded-[4px] border border-[#f0f0f0] p-5 shadow-sm">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#241f20]">Product Details</h2>
                    <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-[#5c4d43]">
                      {product.details.map((detail) => (
                        <li key={detail} className="flex gap-3">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d8a734]" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Drapes */}
        {relatedProducts.length > 0 && (
          <section className="mt-20 border-t border-[#ead8b7] bg-[#f4f4f4] py-20">
            <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
              <div className="mb-14 flex flex-col items-center text-center">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d8a734]">
                  Similar Drapes
                </p>
                <h2 className="text-4xl font-black text-[#241f20] sm:text-5xl">
                  Recommended from this style
                </h2>
                <div className="mt-4 h-[2px] w-12 bg-[#d8a734]" />
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-x-6 sm:gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard key={item._id} product={item} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
