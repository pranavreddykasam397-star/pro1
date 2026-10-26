'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Trophy, AlertCircle, RotateCcw, Zap } from 'lucide-react';

interface DiscountMiniGameProps {
  onWin: (discountAmount: number) => void;
  onClose: () => void;
}

export function DiscountMiniGame({ onWin, onClose }: DiscountMiniGameProps) {
  // Game Phases: 'intro' | 'switch' | 'clicker' | 'won' | 'lost'
  const [phase, setPhase] = useState<'intro' | 'switch' | 'clicker' | 'won' | 'lost'>('switch');

  // Switch Phase State
  const [switches, setSwitches] = useState<boolean[]>([false, false, false, false]);
  const [realSwitchIndex] = useState(() => Math.floor(Math.random() * 4));
  const [mistakes, setMistakes] = useState(0);
  const maxMistakes = 3;

  // Clicker Phase State
  const [clicks, setClicks] = useState(0);
  const targetClicks = 50;
  const [timeLeft, setTimeLeft] = useState(10);
  const [clickerStarted, setClickerStarted] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const clicksRef = useRef(0);
  clicksRef.current = clicks;

  // Switch Click Handler
  const handleSwitchToggle = (index: number) => {
    if (phase !== 'switch' || switches[index]) return;

    const newSwitches = [...switches];
    newSwitches[index] = true;
    setSwitches(newSwitches);

    if (index === realSwitchIndex) {
      // Correct switch unlocked! Move to Clicker phase
      setPhase('clicker');
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= maxMistakes) {
        setPhase('lost');
      }
    }
  };

  // Clicker Timer Handler - Wall-clock based, immune to click re-renders
  useEffect(() => {
    if (phase !== 'clicker' || !clickerStarted) return;

    // Start 10-second countdown based on actual timestamp
    const durationMs = 10000;
    endTimeRef.current = Date.now() + durationMs;

    const interval = setInterval(() => {
      if (!endTimeRef.current) return;
      const remainingMs = endTimeRef.current - Date.now();
      const secondsLeft = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeft(secondsLeft);

      if (remainingMs <= 0) {
        clearInterval(interval);
        endTimeRef.current = null;
        if (clicksRef.current >= targetClicks) {
          setPhase('won');
          onWin(50); // ₹50 flat discount
        } else {
          setPhase('lost');
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [phase, clickerStarted, targetClicks, onWin]);

  // Clicker Tap Handler
  const handleTap = () => {
    if (phase !== 'clicker' || timeLeft <= 0) return;

    if (!clickerStarted) {
      setClickerStarted(true);
    }

    const nextClicks = clicks + 1;
    setClicks(nextClicks);

    if (nextClicks >= targetClicks) {
      endTimeRef.current = null;
      setPhase('won');
      onWin(50); // ₹50 discount unlocked
    }
  };

  // Reset Game
  const resetGame = () => {
    setPhase('switch');
    setSwitches([false, false, false, false]);
    setMistakes(0);
    setClicks(0);
    setTimeLeft(10);
    setClickerStarted(false);
    endTimeRef.current = null;
  };

  return (
    <Card className="p-5 border border-gold/40 bg-cream-deep/80 shadow-md rounded-xl text-center relative overflow-hidden">
      {/* Decorative Gold Accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold-light to-gold" />

      {/* PHASE 1: SWITCH PUZZLE */}
      {phase === 'switch' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-gold">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold tracking-wide text-ink">
              Phase 1: The Circuit Puzzle
            </h3>
          </div>
          <p className="text-xs text-ink-soft">
            Find the active circuit switch to unlock the discount vault. You have{' '}
            <span className="font-semibold text-destructive">{maxMistakes - mistakes}</span> chances
            remaining!
          </p>

          <div className="grid grid-cols-4 gap-2 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSwitchToggle(idx)}
                disabled={switches[idx]}
                className={`h-16 rounded-lg font-bold text-sm flex flex-col items-center justify-center transition-all ${
                  switches[idx]
                    ? idx === realSwitchIndex
                      ? 'bg-green-600 text-white shadow-inner'
                      : 'bg-red-500/20 text-destructive border border-red-300'
                    : 'bg-white hover:bg-gold/10 border-2 border-dashed border-gold/60 text-ink hover:scale-105 active:scale-95 shadow-sm'
                }`}
              >
                <Zap className={`w-4 h-4 mb-1 ${switches[idx] ? 'text-white' : 'text-gold'}`} />
                <span>#{idx + 1}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-ink-soft pt-1">
            <span>Mistakes: {mistakes} / {maxMistakes}</span>
            <button onClick={onClose} className="hover:underline text-ink-soft">
              Skip Game
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: SPEED CLICKER */}
      {phase === 'clicker' && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-gold">
            <Trophy className="w-5 h-5 text-gold" />
            <h3 className="font-serif text-lg font-bold tracking-wide text-ink">
              Phase 2: Speed Tapper!
            </h3>
          </div>
          <p className="text-xs text-ink-soft">
            Tap the button <span className="font-bold text-ink">{targetClicks} times</span> within{' '}
            <span className="font-bold text-destructive">10 seconds</span> to unlock your ₹50 discount!
          </p>

          <div className="flex justify-between items-center px-4 py-1 bg-white rounded-md border border-gold/30">
            <span className="text-xs font-semibold text-ink">
              Time Left: <span className="text-destructive text-sm font-bold">{timeLeft}s</span>
            </span>
            <span className="text-xs font-semibold text-ink">
              Taps: <span className="text-gold text-sm font-bold">{clicks}</span> / {targetClicks}
            </span>
          </div>

          {/* Large Tap Target */}
          <button
            type="button"
            onClick={handleTap}
            className="w-full py-8 rounded-xl font-bold text-xl bg-gradient-to-r from-gold via-gold-light to-gold text-white shadow-lg active:scale-95 transition-transform select-none flex items-center justify-center gap-2"
          >
            <Zap className="w-6 h-6 animate-bounce" />
            {clickerStarted ? 'TAP FAST!' : 'TAP TO START!'}
          </button>

          {/* Progress Bar */}
          <div className="w-full bg-parchment h-2 rounded-full overflow-hidden">
            <div
              className="bg-gold h-full transition-all duration-100"
              style={{ width: `${Math.min(100, (clicks / targetClicks) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* PHASE: WON */}
      {phase === 'won' && (
        <div className="py-4 space-y-3">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-xl font-bold text-ink">₹50 Discount Unlocked! 🎉</h4>
          <p className="text-xs text-ink-soft">
            Congratulations! ₹50 has been deducted from your order subtotal.
          </p>
          <Button
            type="button"
            onClick={onClose}
            className="bg-gold hover:bg-gold-light text-white font-semibold text-xs px-6"
          >
            Continue to Checkout
          </Button>
        </div>
      )}

      {/* PHASE: LOST */}
      {phase === 'lost' && (
        <div className="py-4 space-y-3">
          <div className="w-12 h-12 bg-red-100 text-destructive rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="font-serif text-lg font-bold text-ink">Challenge Missed</h4>
          <p className="text-xs text-ink-soft">
            {mistakes >= maxMistakes
              ? 'Too many circuit mistakes. Try again to claim the discount!'
              : 'Time expired before reaching 50 clicks.'}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetGame}
              className="text-xs flex items-center gap-1 border-gold/50 text-gold hover:bg-gold/10"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-ink-soft"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
