"use client";

import { useEffect, useState, useRef } from "react";

function useCountUp(endValue, duration = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime = null;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * endValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, endValue, duration]);

  return { count, ref };
}

const StatItem = ({ endValue, suffix, label, icon }) => {
  const { count, ref } = useCountUp(endValue, 2500);

  return (
    <div ref={ref} className="group flex flex-col items-center text-center">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#d8a734]/30 bg-[#8b001c] shadow-[0_0_30px_rgba(216,167,52,0.1)] transition-transform duration-700 group-hover:-translate-y-2 group-hover:border-[#d8a734]/70 group-hover:shadow-[0_0_40px_rgba(216,167,52,0.2)]">
        <div className="text-[#d8a734] transition-colors duration-500 group-hover:text-white">
          {icon}
        </div>
        <div className="absolute inset-0 rounded-full border border-[#d8a734]/10 scale-110" />
      </div>
      <div className="mb-3 flex items-baseline justify-center">
        <span className="text-5xl sm:text-6xl font-black tracking-tight text-white drop-shadow-md">
          {count}
        </span>
        <span className="text-3xl font-bold text-[#d8a734] ml-1">
          {suffix}
        </span>
      </div>
      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#f6e7c3]/80">
        {label}
      </div>
    </div>
  );
};

export default function StatsCounter() {
  return (
    <section className="bg-white pb-12 sm:pb-16">
      {/* Removed max-w-7xl to make it full width edge-to-edge */}
      <div className="mx-auto w-full">
        
        {/* Premium Outer Container */}
        <div className="relative bg-[#5f0015] shadow-2xl overflow-hidden border-y border-[#d8a734]/30">
          {/* Decorative subtle texture/gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b001c]/40 via-transparent to-[#2a0009]/80" />
          
          {/* Inner Content Area */}
          <div className="relative px-6 py-12 sm:px-12 sm:py-14 backdrop-blur-sm">
            
            <div className="mb-8 flex flex-col items-center text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[#d8a734]">
                The Legacy
              </p>
              <h2 className="text-2xl font-black tracking-wide text-white sm:text-3xl">
                Our Milestones
              </h2>
              <div className="mt-3 h-[2px] w-12 bg-[#d8a734]/60" />
            </div>

            <div className="mx-auto max-w-[90rem] grid gap-y-10 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
              <StatItem 
                endValue={99} 
                suffix="K+" 
                label="Sarees Packed" 
                icon={(
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                    <path d="m3.3 7 8.7 5 8.7-5"/>
                    <path d="M12 22V12"/>
                  </svg>
                )}
              />
              <StatItem 
                endValue={66} 
                suffix=".5K+" 
                label="Delivered Items" 
                icon={(
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/>
                    <path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/>
                    <circle cx="7" cy="18" r="2"/>
                    <path d="M15 18H9"/>
                    <circle cx="17" cy="18" r="2"/>
                  </svg>
                )}
              />
              <StatItem 
                endValue={44} 
                suffix="K+" 
                label="Successful Orders" 
                icon={(
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    <circle cx="9" cy="21" r="2"/>
                    <circle cx="20" cy="21" r="2"/>
                  </svg>
                )}
              />
              <StatItem 
                endValue={25} 
                suffix="K+" 
                label="Happy Customers" 
                icon={(
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                )}
              />
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
