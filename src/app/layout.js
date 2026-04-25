import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { shopDetails } from "@/lib/shop";

export const metadata = {
  title: `${shopDetails.shortName} Elampillai | Saree Store`,
  description:
    shopDetails.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <Header />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
