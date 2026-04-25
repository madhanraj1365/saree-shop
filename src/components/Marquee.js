function ReviewCard({ review, index }) {
  const text = review.text || String(review);
  const name = review.name || "SMS Tex Customer";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-2 min-h-[256px] w-[224px] rounded-[6px] bg-white px-4 py-5 shadow-[0_4px_18px_rgba(36,31,32,0.06)] sm:mx-3">
      <svg className="h-8 w-8 fill-[#2e2e2e]" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8.4 5.5c-2.9 1.7-4.7 4.2-4.7 7.7V18h6.4v-6.3H6.8c.1-1.8.9-3.2 2.5-4.3L8.4 5.5Zm11 0c-2.9 1.7-4.7 4.2-4.7 7.7V18h6.4v-6.3h-3.3c.1-1.8.9-3.2 2.5-4.3l-.9-1.9Z" />
      </svg>
      <p className="mt-4 min-h-[68px] text-[12px] leading-5 text-[#333] line-clamp-4">{text}</p>
      <div className="mt-2 text-right">
        <span className="text-[11px] font-black text-black">Read More</span>
      </div>
      <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-[#9c9c9c] bg-[#f4f4f4] text-[11px] font-black text-[#8b001c]">
        {initials || index + 1}
      </div>
      <p className="mt-4 text-[12px] font-medium text-[#333]">{name}</p>
      <div className="mt-2 flex gap-0.5 text-[#ffcf24]" aria-label={`${review.rating || 5} star rating`}>
        {Array.from({ length: review.rating || 5 }).map((_, starIndex) => (
          <span key={starIndex}>&#9733;</span>
        ))}
      </div>
    </div>
  );
}

export default function Marquee({ items, variant = "trust" }) {
  const repeatedItems = [...items, ...items, ...items];

  return (
    <div className={`marquee ${variant === "reviews" ? "py-8" : "py-5"}`}>
      <div className="marquee-track">
        {repeatedItems.map((item, index) =>
          variant === "reviews" ? (
            <ReviewCard key={`${item.name || item}-${index}`} review={item} index={index} />
          ) : (
            <div
              key={`${item}-${index}`}
              className="mx-8 flex items-center gap-3 whitespace-nowrap text-sm font-bold uppercase tracking-[0.14em] text-[#241f20]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#d8a734]" />
              <span>{item}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
