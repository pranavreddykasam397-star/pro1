'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type HTMLMotionProps, type Variants } from 'motion/react';
import gsap from 'gsap';
import { Loader2, CheckCircle2, AlertCircle, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// 1. AnimatedButton Component (Heritage Primary & Arcade Clicker)
// ============================================================================

export interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?:
    | 'heritage-primary'
    | 'arcade-clicker'
    | 'default'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  isMagnetic?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  loadingText?: string;
  successText?: string;
  urgency?: 'normal' | 'high' | 'critical';
  children?: React.ReactNode;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  label: string;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      variant = 'heritage-primary',
      size = 'default',
      isMagnetic,
      isLoading = false,
      isSuccess = false,
      isError = false,
      loadingText = 'Processing...',
      successText = 'Success!',
      urgency = 'normal',
      className,
      disabled,
      children,
      onClick,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const ref = (forwardedRef || internalRef) as React.RefObject<HTMLButtonElement>;

    // State for Arcade Particles
    const [particles, setParticles] = useState<Particle[]>([]);

    // Determine if magnetic hover should be active (enabled by default for heritage-primary)
    const shouldMagnetize =
      isMagnetic !== undefined ? isMagnetic : variant === 'heritage-primary';

    // --------------------------------------------------------------------------
    // GSAP Magnetic Attraction Effect (Desktop only, 40px radius)
    // --------------------------------------------------------------------------
    useEffect(() => {
      const el = ref.current;
      if (!el || !shouldMagnetize || disabled || isLoading) return;

      // Gracefully bypass on touchscreen / mobile devices
      if (typeof window !== 'undefined' && !window.matchMedia('(pointer: fine)').matches) {
        return;
      }

      const magneticRadius = 40;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;
        const distance = Math.hypot(deltaX, deltaY);

        if (distance < rect.width / 2 + magneticRadius) {
          const pullStrength = 0.22;
          gsap.to(el, {
            x: deltaX * pullStrength,
            y: deltaY * pullStrength,
            duration: 0.25,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        } else {
          gsap.to(el, {
            x: 0,
            y: 0,
            duration: 0.45,
            ease: 'elastic.out(1.1, 0.4)',
            overwrite: 'auto',
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1.2, 0.35)',
          overwrite: 'auto',
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      el.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        el?.removeEventListener('mouseleave', handleMouseLeave);
      };
    }, [shouldMagnetize, disabled, isLoading, ref]);

    // --------------------------------------------------------------------------
    // Click Handler (with Arcade Particles for arcade-clicker)
    // --------------------------------------------------------------------------
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      if (variant === 'arcade-clicker') {
        // Spawn floating particle
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const newParticle: Particle = {
          id: Date.now() + Math.random(),
          x: clickX,
          y: clickY,
          label: '+1',
        };
        setParticles((prev) => [...prev.slice(-8), newParticle]);

        // Clean up particle after animation
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== newParticle.id));
        }, 700);
      }

      onClick?.(e);
    };

    // --------------------------------------------------------------------------
    // Base Sizes & Variants
    // --------------------------------------------------------------------------
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs rounded-lg',
      default: 'h-10 px-5 text-sm rounded-xl',
      lg: 'h-12 px-7 text-base rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-xl flex items-center justify-center',
    }[size];

    // Variant-specific styles
    let variantClasses = '';
    if (variant === 'heritage-primary') {
      variantClasses =
        'relative overflow-hidden font-semibold text-white bg-gradient-to-r from-amber-600 via-gold to-amber-600 hover:from-amber-500 hover:via-gold-light hover:to-amber-500 shadow-md hover:shadow-xl hover:shadow-gold/20 border border-gold/40 select-none';
    } else if (variant === 'arcade-clicker') {
      const pulseClass =
        urgency === 'critical'
          ? 'animate-pulse ring-4 ring-destructive/40'
          : urgency === 'high'
          ? 'ring-2 ring-gold/50'
          : '';
      variantClasses = cn(
        'relative select-none font-bold text-white bg-gradient-to-b from-amber-400 via-gold to-amber-600 border-b-6 border-amber-800 shadow-[0_8px_0_#78350f] active:translate-y-[6px] active:border-b-0 active:shadow-[0_2px_0_#78350f] transition-all rounded-2xl',
        pulseClass
      );
    } else if (variant === 'outline') {
      variantClasses =
        'border border-parchment bg-white text-ink hover:bg-cream-deep hover:border-gold/40 shadow-xs';
    } else if (variant === 'destructive') {
      variantClasses = 'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20';
    } else if (variant === 'secondary') {
      variantClasses = 'bg-cream-deep text-ink hover:bg-parchment border border-parchment';
    } else if (variant === 'ghost') {
      variantClasses = 'hover:bg-cream-deep text-ink-soft hover:text-ink';
    } else {
      variantClasses = 'bg-ink text-white hover:bg-ink-soft shadow-xs';
    }

    return (
      <motion.button
        ref={ref}
        type="button"
        layout
        whileTap={{ scale: variant === 'arcade-clicker' ? 0.98 : 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={handleClick}
        disabled={disabled || isLoading}
        animate={
          isError
            ? { x: [-8, 8, -6, 6, -3, 3, 0], transition: { duration: 0.4 } }
            : {}
        }
        className={cn(
          'inline-flex items-center justify-center font-medium cursor-pointer transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-60',
          sizeClasses,
          variantClasses,
          isSuccess && 'bg-green-600 text-white border-green-600 shadow-green-600/20',
          className
        )}
        {...props}
      >
        {/* Luxury Gold Shimmer Sweep Overlay for Heritage Primary */}
        {variant === 'heritage-primary' && !isLoading && !isSuccess && (
          <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
            <span className="absolute -inset-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-25 animate-shimmer" />
          </span>
        )}

        {/* Floating "+1" particles for Arcade Clicker */}
        {variant === 'arcade-clicker' && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{ opacity: 1, y: p.y, x: p.x, scale: 0.8 }}
                animate={{ opacity: 0, y: p.y - 50, x: p.x + (Math.random() * 20 - 10), scale: 1.4 }}
                transition={{ duration: 0.65, ease: 'easeOut' as const }}
                className="absolute text-amber-200 font-extrabold text-xl pointer-events-none drop-shadow-md"
              >
                {p.label}
              </motion.span>
            ))}
          </div>
        )}

        {/* Async State Morphing Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-2"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{loadingText}</span>
            </motion.span>
          ) : isSuccess ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>{successText}</span>
            </motion.span>
          ) : isError ? (
            <motion.span
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4 text-white" />
              <span>Retry</span>
            </motion.span>
          ) : (
            <motion.span
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 inline-flex items-center gap-2"
            >
              {children}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }
);
AnimatedButton.displayName = 'AnimatedButton';

// ============================================================================
// 2. MorphingCartButton ("Add to Cart" -> Quantity Counter Pill)
// ============================================================================

export interface MorphingCartButtonProps {
  count: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
  size?: 'sm' | 'default';
}

export function MorphingCartButton({
  count,
  onAdd,
  onIncrement,
  onDecrement,
  className,
  size = 'sm',
}: MorphingCartButtonProps) {
  const prevCountRef = useRef(count);
  const direction = count >= prevCountRef.current ? 'up' : 'down';

  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  const numberVariants: Variants = {
    initial: (dir: 'up' | 'down') => ({
      y: dir === 'up' ? 12 : -12,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.18, ease: 'easeOut' as const },
    },
    exit: (dir: 'up' | 'down') => ({
      y: dir === 'up' ? -12 : 12,
      opacity: 0,
      transition: { duration: 0.15, ease: 'easeIn' as const },
    }),
  };

  const isSmall = size === 'sm';

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      className={cn('inline-flex items-center justify-center select-none', className)}
    >
      <AnimatePresence mode="wait">
        {count === 0 ? (
          <motion.button
            key="add-button"
            type="button"
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileTap={{ scale: 0.94 }}
            onClick={onAdd}
            className={cn(
              'group relative overflow-hidden bg-gold hover:bg-gold-light text-white font-semibold rounded-xl shadow-xs hover:shadow-md transition-colors flex items-center gap-1.5 cursor-pointer',
              isSmall ? 'text-xs px-3.5 py-1.5' : 'text-sm px-4 py-2'
            )}
          >
            {/* Subtle ripple wave on hover */}
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 font-bold">Add</span>
          </motion.button>
        ) : (
          <motion.div
            key="counter-pill"
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            className={cn(
              'flex items-center gap-1.5 bg-cream-deep/90 border border-gold/40 rounded-xl shadow-xs backdrop-blur-xs',
              isSmall ? 'p-1' : 'p-1.5'
            )}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={onDecrement}
              className={cn(
                'rounded-lg bg-white text-ink flex items-center justify-center hover:bg-parchment shadow-2xs transition-colors cursor-pointer',
                isSmall ? 'w-6 h-6' : 'w-7 h-7'
              )}
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </motion.button>

            {/* Sliding Numbers */}
            <div className="w-5 text-center overflow-hidden relative h-5 flex items-center justify-center">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.span
                  key={count}
                  custom={direction}
                  variants={numberVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="font-bold text-xs text-ink tabular-nums block"
                >
                  {count}
                </motion.span>
              </AnimatePresence>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={onIncrement}
              className={cn(
                'rounded-lg bg-white text-ink flex items-center justify-center hover:bg-parchment shadow-2xs transition-colors cursor-pointer',
                isSmall ? 'w-6 h-6' : 'w-7 h-7'
              )}
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// 3. SlidingFilterPill (Shared layoutId Spring Transition Tabs)
// ============================================================================

export interface SlidingFilterPillProps {
  isSelected: boolean;
  onClick: () => void;
  layoutId?: string;
  icon?: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SlidingFilterPill({
  isSelected,
  onClick,
  layoutId = 'active-filter-pill',
  icon,
  label,
  badge,
  className,
  disabled = false,
}: SlidingFilterPillProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap flex items-center gap-2 cursor-pointer transition-colors duration-200 outline-none select-none',
        isSelected
          ? 'text-white'
          : 'text-ink-soft hover:text-ink bg-white/70 hover:bg-cream-deep/60 border border-parchment shadow-xs',
        disabled && 'opacity-40 pointer-events-none',
        className
      )}
    >
      {/* Gliding Shared Spring Background Highlight */}
      {isSelected && (
        <motion.div
          layoutId={layoutId}
          transition={{ type: 'spring', stiffness: 450, damping: 34 }}
          className="absolute inset-0 bg-gradient-to-r from-amber-600 via-gold to-amber-600 rounded-xl shadow-md -z-10"
        />
      )}

      {icon && (
        <span className="text-sm sm:text-base group-hover:scale-110 transition-transform">
          {icon}
        </span>
      )}
      <span className="relative z-10">{label}</span>
      {badge && <span className="relative z-10">{badge}</span>}
    </motion.button>
  );
}
