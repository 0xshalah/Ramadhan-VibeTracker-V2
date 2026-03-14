"use client";
import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

export default function XPBurst({ points, trigger }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (points > 0 && containerRef.current) {
      // Particle burst animation
      anime({
        targets: containerRef.current.querySelectorAll('.xp-particle'),
        translateY: [0, -50],
        translateX: () => anime.random(-30, 30),
        opacity: [1, 0],
        scale: [0.5, 1.5],
        duration: 800,
        easing: 'easeOutExpo',
        delay: anime.stagger(50)
      });
      
      // Score text spring animation
      anime({
        targets: containerRef.current.querySelector('.xp-score'),
        scale: [0.5, 1.2, 1],
        opacity: [0, 1],
        duration: 1000,
        easing: 'spring(1, 80, 10, 0)'
      });
    }
  }, [points, trigger]);

  if (!points || points <= 0) return null;

  return (
    <div ref={containerRef} className="relative flex items-center justify-center pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="xp-particle absolute w-2 h-2 bg-amber-400 rounded-full opacity-0" />
      ))}
      <div className="xp-score font-black text-lg text-amber-500 opacity-0">
        +{points} XP ✨
      </div>
    </div>
  );
}
