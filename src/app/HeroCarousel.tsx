"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Full-screen auto-advancing horizontal slide carousel for the homepage
// hero — each photo slides in from the right, pushing the previous one out
// to the left.
//
// Implementation note: this uses a single linear "filmstrip" track that
// only ever moves in one direction, with one extra clone of the first photo
// appended at the end. That avoids the classic "shortest path" wraparound
// bug, where trying to figure out per-slide whether looping back to the
// start is shorter via the left or the right can flip mid-sequence and
// make a slide visibly sweep across the whole screen — looking like two
// slides animating in opposite directions at once. Here, once the strip
// slides onto the clone (pixel-identical to the real first photo), it
// snaps back to the real first photo with the transition turned off, which
// is invisible since the two frames look identical.
export default function HeroCarousel({ images }: { images: string[] }) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const count = images.length;
  const slides = count > 1 ? [...images, images[0]] : images;

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => {
      setAnimate(true);
      setTrackIndex((i) => i + 1);
    }, 6000);
    return () => clearInterval(id);
  }, [count]);

  useEffect(() => {
    if (trackIndex !== count) return;
    // Just landed on the clone — once the slide-in has visually finished,
    // jump back to the real first photo with no transition.
    const timeout = setTimeout(() => {
      setAnimate(false);
      setTrackIndex(0);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [trackIndex, count]);

  if (count === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="flex h-full"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(trackIndex * 100) / slides.length}%)`,
          transition: animate ? "transform 1000ms ease-in-out" : "none",
        }}
      >
        {slides.map((src, i) => (
          <div
            key={i}
            className="relative h-full"
            style={{ width: `${100 / slides.length}%` }}
          >
            <Image
              src={src}
              alt=""
              fill
              priority={i === 0}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
