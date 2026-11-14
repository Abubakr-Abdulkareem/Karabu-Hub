"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (target: number) => {
      const track = trackRef.current;
      if (!track || images.length === 0) return;
      const next = (target + images.length) % images.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    },
    [images.length]
  );

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  // Auto-advance every 4 seconds
  useEffect(() => {
    if (images.length < 2 || paused) return;
    const id = setInterval(() => goTo(indexRef.current + 1), 4000);
    return () => clearInterval(id);
  }, [paused, images.length, goTo]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  function handleScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== indexRef.current) setIndex(i);
  }

  function pause() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    setPaused(true);
  }

  function resumeLater() {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), 5000);
  }

  return (
    <div
      className="cut-corner relative overflow-hidden bg-surface-2"
      onMouseEnter={pause}
      onMouseLeave={resumeLater}
      onTouchStart={pause}
      onTouchEnd={resumeLater}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((url, i) => (
          <div key={url} className="w-full shrink-0 snap-center">
            <Image
              src={url}
              alt={`${alt} ${i + 1}`}
              width={600}
              height={800}
              priority={i === 0}
              className="aspect-3/4 w-full object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <span className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-xs">
            {index + 1}/{images.length}
          </span>

          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/70 p-2 hover:bg-background md:block"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/70 p-2 hover:bg-background md:block"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-accent" : "w-1.5 bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}