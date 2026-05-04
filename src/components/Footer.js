import Link from "next/link";
import { getCollections } from "@/lib/catalog-store";
import { shopDetails } from "@/lib/shop";

export default async function Footer() {
  const collections = await getCollections();
  const footerImage = collections[0]?.image || "/sms-tex-logo.jpg";

  return (
    <footer id="contact" className="bg-[#2c2420] text-white">
      <div className="mx-auto grid max-w-[1600px] gap-16 px-4 py-20 sm:px-6 lg:grid-cols-[1.5fr_0.8fr_0.8fr_1.2fr] lg:gap-10 lg:px-12 lg:py-28">
        <div>
          <div className="overflow-hidden rounded-[8px] border border-white/10 w-fit">
            <img
              src="/sms-tex-logo.jpg"
              alt={shopDetails.name}
              loading="lazy"
              className="h-32 w-auto object-contain bg-white"
            />
          </div>
          <h2 className="mt-8 font-serif text-4xl tracking-wide text-[#fbf9f6]">
            {shopDetails.shortName} <span className="text-[#d4af37]">Sarees</span>
          </h2>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#eaddcf]">
            {shopDetails.description}
          </p>
          <div className="mt-8 space-y-3 text-sm text-[#eaddcf]">
            <p className="flex items-center gap-3">
              <span className="text-[#d4af37]">Phone:</span> {shopDetails.phone}
            </p>
            <p className="flex items-center gap-3">
              <span className="text-[#d4af37]">WhatsApp:</span> {shopDetails.whatsapp}
            </p>
            <p className="flex items-start gap-3">
              <span className="text-[#d4af37]">Address:</span> 
              <span>
                {shopDetails.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Explore
          </h3>
          <div className="mt-8 grid gap-4 text-sm text-[#eaddcf]">
            {["About Us", "Contact", "FAQ", "Terms", "Privacy"].map((link) => (
              <Link key={link} href="/#contact" className="w-fit transition-colors hover:text-[#d4af37]">
                {link}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Collections
          </h3>
          <div className="mt-8 grid gap-4 text-sm text-[#eaddcf]">
            {collections.map((collection) => (
              <Link
                key={collection.slug}
                href={`/products?collection=${collection.slug}`}
                className="w-fit transition-colors hover:text-[#d4af37]"
              >
                {collection.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#d4af37]">
            Store details
          </h3>
          <p className="mt-8 text-sm leading-relaxed text-[#eaddcf]">
            {shopDetails.primaryCategory} with support for wholesale buyers, direct customers,
            and trusted repeat relationships across Salem and beyond.
          </p>
          <div className="mt-6 space-y-3 text-sm text-[#eaddcf]">
            <p>{shopDetails.additionalCategories.join(" • ")}</p>
            <p>{shopDetails.hours.weekdays}</p>
            <p>{shopDetails.hours.sunday}</p>
          </div>
          <div className="mt-10 overflow-hidden rounded-xl border border-white/10 opacity-80 transition-opacity hover:opacity-100">
            <iframe
              title="Store location"
              className="h-32 w-full border-0 grayscale hover:grayscale-0 transition-all duration-500"
              loading="lazy"
              src={shopDetails.mapEmbedSrc}
            />
          </div>
        </div>
      </div>
      
      <div className="border-t border-white/10 py-6 text-center">
        <p className="text-xs text-[#eaddcf]/60 tracking-wider">
          &copy; {new Date().getFullYear()} {shopDetails.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
