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
    <div className="grid gap-6 sm:grid-cols-[80px_1fr] lg:grid-cols-[100px_1fr]">
      <div className="hidden flex-col gap-4 sm:flex">
        {images.map((image, idx) => (
          <div 
            key={image} 
            onClick={() => selectImage(idx)}
            className={`aspect-[4/5] w-full overflow-hidden rounded-lg border bg-[#fbf9f6] transition-opacity cursor-pointer ${currentIndex === idx ? 'border-[#d4af37] opacity-100' : 'border-[#eaddcf] opacity-50 hover:opacity-100'}`}
          >
            <Image
              src={image || "/placeholder.jpg"}
              alt=""
              width={100}
              height={125}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      
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
                  className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'w-4 bg-[#d4af37]' : 'w-1.5 bg-white/60'}`} 
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
