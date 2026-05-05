import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { shopDetails } from "@/lib/shop";
import NextTopLoader from 'nextjs-toploader';

export const metadata = {
  title: `${shopDetails.shortName} Elampillai | Saree Store`,
  description:
    shopDetails.description,
};

import { ProductCacheProvider } from "@/context/ProductCacheContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <NextTopLoader color="#8b001c" height={3} showSpinner={false} />
        <ProductCacheProvider>
          <Header />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </ProductCacheProvider>
      </body>
    </html>
  );
}
