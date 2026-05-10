import React, { useState, useEffect } from 'react';

export default function ClickerGame({ onWin, onLose }) {
    const [clicks, setClicks] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'won', 'lost'
    const targetClicks = 50;

    useEffect(() => {
        let timer;
        if (gameState === 'playing' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameState('lost');
                        if (onLose) setTimeout(() => onLose(), 1500);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timeLeft === 0 && gameState === 'playing') {
            setGameState('lost');
            if (onLose) setTimeout(() => onLose(), 1500);
        }

        return () => {
            if (timer) clearInterval(timer);
        };
    }, [gameState, timeLeft]);

    const handleClick = () => {
        if (gameState === 'won' || gameState === 'lost') return;
        
        if (gameState === 'idle') {
            setGameState('playing');
        }
        
        const newClicks = clicks + 1;
        setClicks(newClicks);

        if (newClicks >= targetClicks && timeLeft > 0) {
            setGameState('won');
            if (onWin) setTimeout(() => onWin(), 1500);
        }
    };

    const resetGame = () => {
        setClicks(0);
        setTimeLeft(15);
        setGameState('idle');
    };

    let statusText = "Click 50 times in 15 seconds!";
    let statusColor = "var(--ink)";
    let buttonColor = "var(--gold)";

    if (gameState === 'won') {
        statusText = "🎉 You won the discount! 🎉";
        statusColor = "#27ae60";
        buttonColor = "#27ae60";
    } else if (gameState === 'lost') {
        statusText = "Too slow! Game Over.";
        statusColor = "#c0392b";
        buttonColor = "gray";
    }

    return (
        <div style={{ padding: '1rem', background: 'var(--cream)', borderRadius: '8px', border: '1px solid var(--parchment)', textAlign: 'center', margin: '1rem', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }} className="serif">Speed Clicker Game</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--cream-deep)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--parchment)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '1px' }}>Time Left</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft <= 5 && gameState === 'playing' ? '#c0392b' : 'var(--ink)' }}>{timeLeft}s</p>
                </div>
                <div style={{ background: 'var(--cream-deep)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--parchment)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-soft)', textTransform: 'uppercase', letterSpacing: '1px' }}>Clicks</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold)' }}>{clicks}/{targetClicks}</p>
                </div>
            </div>

            <h4 style={{ color: statusColor, marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 'bold', minHeight: '1.2rem' }}>{statusText}</h4>
            
            <button 
                onClick={handleClick}
                disabled={gameState === 'won' || gameState === 'lost'}
                className="admin-btn"
                style={{ 
                    width: '100%', 
                    padding: '1.5rem', 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    background: buttonColor,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: gameState === 'playing' ? '0 4px 15px rgba(0,0,0,0.1)' : 'none',
                    transform: gameState === 'playing' ? 'scale(1)' : 'scale(0.98)',
                    transition: 'all 0.1s ease',
                    cursor: (gameState === 'won' || gameState === 'lost') ? 'default' : 'pointer'
                }}
            >
                {gameState === 'idle' ? 'START CLICKING!' : gameState === 'playing' ? 'CLICK ME!' : gameState === 'won' ? 'WINNER!' : 'FAILED'}
            </button>
            
            {(gameState === 'won' || gameState === 'lost') && (
                <button 
                    onClick={resetGame}
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem', marginTop: '1rem', background: 'transparent', border: '1px solid var(--parchment)', color: 'var(--text-soft)', borderRadius: '4px', cursor: 'pointer' }}
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
