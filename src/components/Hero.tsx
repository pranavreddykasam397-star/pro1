'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { HeritageDiya3D } from '@/components/HeritageDiya3D';
import { ArrowDown, Sparkles, ArrowRight } from 'lucide-react';
import gsap from 'gsap';

interface HeroProps {
  onExploreClick: () => void;
  isExpanded: boolean;
  onSelectPreference: (pref: 'veg' | 'non-veg') => void;
  selectedPreference: 'all' | 'veg' | 'non-veg';
  vegCount?: number;
  nonVegCount?: number;
}

// Interactive 3D Holographic Tilt Card Component
function ThreeDTiltCard({
  children,
  onClick,
  cardRef,
  glowColor = 'emerald',
}: {
  children: React.ReactNode;
  onClick: () => void;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  glowColor: 'emerald' | 'rose';
}) {
  const localRef = useRef<HTMLDivElement>(null);
  const targetRef = cardRef || localRef;

  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [sheen, setSheen] = useState<{ x: number; y: number; opacity: number }>({
    x: 50,
    y: 50,
    opacity: 0,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!targetRef.current) return;
    const rect = targetRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -6; // subtle tilt angle X
    const rotateY = ((x - centerX) / centerX) * 6; // subtle tilt angle Y

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`,
      transition: 'transform 0.1s ease-out',
    });

    setSheen({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.45,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)',
      transition: 'transform 0.4s ease-out',
    });
    setSheen((prev) => ({ ...prev, opacity: 0 }));
  };

  const glowShadow =
    glowColor === 'emerald'
      ? 'hover:shadow-[0_20px_50px_-10px_rgba(16,185,129,0.25)] border-emerald-500/40 hover:border-emerald-600'
      : 'hover:shadow-[0_20px_50px_-10px_rgba(225,29,72,0.25)] border-rose-500/40 hover:border-rose-600';

  return (
    <div
      ref={targetRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltStyle}
      className={`group relative p-6 sm:p-7 rounded-3xl border-2 text-left flex flex-col justify-between bg-white backdrop-blur-xl shadow-lg hover:shadow-2xl cursor-pointer select-none overflow-hidden ${glowShadow}`}
    >
      {/* 3D Glass Light Reflection Sheen */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255, 255, 255, 0.7) 0%, transparent 60%)`,
          opacity: sheen.opacity,
        }}
      />
      {children}
    </div>
  );
}

export function Hero({
  onExploreClick,
  isExpanded,
  onSelectPreference,
  selectedPreference,
  vegCount = 68,
  nonVegCount = 56,
}: HeroProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const boxesContainerRef = useRef<HTMLDivElement>(null);
  const vegCardRef = useRef<HTMLDivElement>(null);
  const nonVegCardRef = useRef<HTMLDivElement>(null);

  // Reveal Preference Boxes on isExpanded
  useEffect(() => {
    if (isExpanded && boxesContainerRef.current) {
      const cards = [vegCardRef.current, nonVegCardRef.current].filter(Boolean);

      // Smooth entrance for container
      gsap.fromTo(
        boxesContainerRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );

      // Both cards animate simultaneously and remain 100% visible
      gsap.fromTo(
        cards,
        {
          opacity: 0,
          scale: 0.96,
          y: 20,
        },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.06,
          ease: 'power2.out',
          clearProps: 'all',
        }
      );

      // Smooth scroll so both cards are immediately centered and fully in view
      setTimeout(() => {
        boxesContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [isExpanded]);

  // Interactive Button Click
  const handleButtonClick = () => {
    if (btnRef.current) {
      gsap.to(btnRef.current, {
        scale: 0.94,
        y: 2,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut',
        onComplete: onExploreClick,
      });
    } else {
      onExploreClick();
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-76px)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 text-center overflow-hidden bg-gradient-to-b from-cream via-cream-deep/40 to-cream border-b border-parchment/60">
      {/* Ambient Lighting Ornaments */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-4 relative z-10 w-full">
        {/* 3D Interactive Floating Brass Diya */}
        <div className="flex justify-center -mb-3 pt-2">
          <HeritageDiya3D size={210} className="drop-shadow-2xl" />
        </div>

        {/* Established Crest Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-xs font-semibold tracking-widest uppercase shadow-xs">
          <Sparkles className="w-3.5 h-3.5" /> Est. Since Always
        </div>

        {/* Brand Title */}
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl font-bold text-ink tracking-tight">
          Heritage Restaurant
        </h1>

        {/* Golden Divider */}
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-ink-soft max-w-xl mx-auto font-sans font-normal leading-relaxed">
          Fine Indian Cuisine · Crafted with Tradition, Royal Spices & Authentic Recipes
        </p>

        {/* Action Button with Luxury Gold Shimmer & Magnetic Hover */}
        <div className="pt-2">
          <AnimatedButton
            ref={btnRef}
            variant="heritage-primary"
            size="lg"
            onClick={handleButtonClick}
            className="rounded-full px-9 py-4 sm:py-4.5 text-sm sm:text-base shadow-xl border-gold/50 cursor-pointer inline-flex items-center gap-2 group"
          >
            <span>Explore Our Menu</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
          </AnimatedButton>
        </div>

        {/* Emergent Preference Boxes (Veg / Non-Veg) */}
        {isExpanded && (
          <div
            ref={boxesContainerRef}
            className="pt-8 w-full max-w-3xl mx-auto"
          >
            <div className="text-center mb-5">
              <span className="text-xs font-bold uppercase tracking-widest text-gold font-sans">
                Step 1 · Choose Your Preference
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-1">
                What would you like to savor today?
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
              {/* Pure Vegetarian Box */}
              <ThreeDTiltCard
                cardRef={vegCardRef}
                onClick={() => onSelectPreference('veg')}
                glowColor="emerald"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* Indian Veg Emblem */}
                    <div className="w-8 h-8 border-2 border-emerald-600 flex items-center justify-center rounded-sm bg-white shadow-xs">
                      <div className="w-4 h-4 bg-emerald-600 rounded-full" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 shadow-2xs">
                      {vegCount} Veg Delicacies
                    </span>
                  </div>

                  <h4 className="font-serif text-2xl sm:text-3xl font-bold text-ink group-hover:text-emerald-700 transition-colors">
                    Pure Vegetarian
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-soft mt-2 leading-relaxed">
                    Velvety paneer curries, slow-simmered dal tadka, garden fresh koftas & tandoori rotis.
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-emerald-100 flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-700">
                  <span>Explore Pure Veg Menu</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
                </div>
              </ThreeDTiltCard>

              {/* 3D Non-Vegetarian Box */}
              <ThreeDTiltCard
                cardRef={nonVegCardRef}
                onClick={() => onSelectPreference('non-veg')}
                glowColor="rose"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    {/* Indian Non-Veg Emblem */}
                    <div className="w-8 h-8 border-2 border-rose-600 flex items-center justify-center rounded-sm bg-white shadow-xs">
                      <div className="w-4 h-4 bg-rose-600 rounded-full" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-rose-100/80 text-rose-800 shadow-2xs">
                      {nonVegCount} Non-Veg Dishes
                    </span>
                  </div>

                  <h4 className="font-serif text-2xl sm:text-3xl font-bold text-ink group-hover:text-rose-700 transition-colors">
                    Non-Vegetarian
                  </h4>
                  <p className="text-xs sm:text-sm text-ink-soft mt-2 leading-relaxed">
                    Dum biryanis, royal butter chicken, spicy chettinad gravies & succulent tandoor kebabs.
                  </p>
                </div>

                <div className="mt-6 pt-3.5 border-t border-rose-100 flex items-center justify-between text-xs sm:text-sm font-bold text-rose-700">
                  <span>Explore Non-Veg Menu</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
                </div>
              </ThreeDTiltCard>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
