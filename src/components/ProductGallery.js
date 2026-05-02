"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function ProductGallery({ images, name }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoSlide, setAutoSlide] = useState(true);
  const timerRef = useRef(null);

  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const imageRef = useRef(null);

  useEffect(() => {
    if (autoSlide && images.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 4000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSlide, images.length]);

  const handleNext = () => {
    setAutoSlide(false);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setAutoSlide(false);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const selectImage = (index) => {
    setAutoSlide(false);
    setCurrentIndex(index);
  };

  const handleMouseMove = (e) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setLensPosition({ x, y });
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="group relative overflow-hidden rounded-xl border border-[#eaddcf] bg-[#fbf9f6] shadow-[0_4px_20px_rgba(44,36,32,0.02)] cursor-crosshair"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        ref={imageRef}
      >
        <Image
          src={images[currentIndex] || "/placeholder.jpg"}
          alt={name}
          priority
          width={800}
          height={1000}
          className="h-auto w-full object-contain transition-opacity duration-300"
        />
        
        {isHovering && (
          <div 
            className="pointer-events-none absolute inset-0 z-10 hidden sm:block"
            style={{
              backgroundImage: `url(${images[currentIndex] || "/placeholder.jpg"})`,
              backgroundPosition: `${lensPosition.x}% ${lensPosition.y}%`,
              backgroundSize: '250%',
              backgroundColor: '#fbf9f6',
            }}
          />
        )}

        {images.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#2c2420] shadow-sm transition-colors hover:bg-white"
              aria-label="Previous image"
            >
              &#10094;
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#2c2420] shadow-sm transition-colors hover:bg-white"
              aria-label="Next image"
            >
              &#10095;
            </button>
            
            {/* Mobile dots indicator */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 sm:hidden">
              {images.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'w-4 bg-[#d8a734]' : 'w-1.5 bg-white/60'}`} 
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails below the image */}
      {images.length > 1 && (
        <div className="flex flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, idx) => (
            <div 
              key={idx} 
              onClick={() => selectImage(idx)}
              className={`relative aspect-[4/5] w-20 sm:w-24 shrink-0 overflow-hidden rounded-lg border bg-[#fbf9f6] transition-all cursor-pointer ${currentIndex === idx ? 'border-[#8b001c] opacity-100 ring-2 ring-[#8b001c]/20' : 'border-[#eaddcf] opacity-60 hover:opacity-100'}`}
            >
              <Image
                src={image || "/placeholder.jpg"}
                alt=""
                fill
                sizes="(max-width: 768px) 80px, 96px"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
