"use client";

import { useState } from "react";

export default function ExpandableDescription({ text }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-8 rounded-[4px] border border-[#f0f0f0] p-5 shadow-sm">
      <div
        className={`relative overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[1000px]" : "max-h-24"
        }`}
      >
        <p className="text-sm leading-relaxed text-[#5c4d43]">
          {text}
        </p>
        
        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
        )}
      </div>
      
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-sm font-bold text-[#8b001c] hover:underline"
      >
        {isExpanded ? "Show Less" : "More"}
      </button>
    </div>
  );
}
