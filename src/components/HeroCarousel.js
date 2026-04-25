"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    eyebrow: "Welcome to",
    title: "SMS TEX SAREES",
    text: "Authentic Elampillai sarees, crafted with tradition.",
    image: "/hero-1.jpg",
  },
  {
    eyebrow: "Premium Quality",
    title: "Elegant & Timeless",
    text: "Stunning designs for weddings and special occasions.",
    image: "/hero-2.jpg",
  },
  {
    eyebrow: "Direct from Weavers",
    title: "Unmatched Craftsmanship",
    text: "Finest fabrics with durable, consistent finishing.",
    image: "/hero-3.jpg",
  },
  {
    eyebrow: "Shop with Confidence",
    title: "Your Trusted Destination",
    text: "24/7 dedicated support and secure delivery.",
    image: "/hero-4.jpg",
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((index) => (index + 1) % slides.length);
    }, 5000); // 5 seconds slide

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[75vh] w-full overflow-hidden bg-[#5f0015] sm:min-h-[85vh]">
      {slides.map((slide, index) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            active === index ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <img
            src={slide.image}
            alt="Saree preview"
            loading={index === 0 ? "eager" : "lazy"}
            className={`h-full w-full object-cover saturate-[1.1] contrast-[1.05] transition-transform duration-[6000ms] ease-out ${
              active === index ? "scale-100" : "scale-105"
            }`}
          />
          {/* subtle gradient so the text in the corner is readable */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-16 left-8 z-20 flex flex-col items-start text-left sm:bottom-20 sm:left-12">
        <div className="max-w-md mix-blend-hard-light drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
          <p className="mb-2 font-serif text-base italic tracking-widest text-[#d8a734] uppercase drop-shadow-md">
            {slides[active].eyebrow}
          </p>
          <h1 className="text-3xl font-serif font-black tracking-wide text-white sm:text-4xl drop-shadow-lg">
            {slides[active].title}
          </h1>
          <p className="mt-3 text-base font-medium leading-relaxed text-[#f4f4f4] sm:text-lg drop-shadow-md">
            {slides[active].text}
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              active === index ? "w-8 bg-[#d8a734]" : "w-1.5 bg-white/50 hover:bg-white/90"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
