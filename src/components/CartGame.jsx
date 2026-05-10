import React, { useState } from 'react';

export default function CartGame({ onWin, onLose }) {
    const [realSwitchIndex, setRealSwitchIndex] = useState(() => Math.floor(Math.random() * 4));
    const [mistakeCount, setMistakeCount] = useState(0);
    const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
    const maxMistakes = 3;

    const checkSwitch = (index) => {
        if (gameState !== 'playing') return;

        if (index === realSwitchIndex) {
            setGameState('won');
            if (onWin) setTimeout(() => onWin(), 1500);
        } else {
            const newMistakeCount = mistakeCount + 1;
            setMistakeCount(newMistakeCount);
            if (newMistakeCount >= maxMistakes) {
                setGameState('lost');
                if (onLose) setTimeout(() => onLose(), 1500);
            }
        }
    };

    let bulbColor = "gray";
    let statusText = "Guess the switch!";
    let statusColor = "var(--ink)";

    if (gameState === 'won') {
        bulbColor = "var(--gold)";
        statusText = "You found it! Light is ON.";
        statusColor = "#27ae60"; // green
    } else if (gameState === 'lost') {
        bulbColor = "black";
        statusText = "GAME OVER! You failed 3 times.";
        statusColor = "#c0392b"; // red
    } else if (mistakeCount > 0) {
        statusText = "Wrong switch! Try again.";
        statusColor = "#f39c12"; // orange
    }

    return (
        <div style={{ padding: '1rem', background: 'var(--cream)', borderRadius: '8px', border: '1px solid var(--parchment)', textAlign: 'center', margin: '1rem', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--gold)' }} className="serif">Mini-Game: Guess the Switch!</h3>
            
            <div style={{ 
                width: '60px', 
                height: '60px', 
                backgroundColor: bulbColor, 
                borderRadius: '50%', 
                margin: '0 auto 1rem', 
                boxShadow: gameState === 'won' ? '0 0 20px var(--gold)' : 'inset 0px 4px 8px rgba(0,0,0,0.3)', 
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease' 
            }}></div>
            
            <h4 style={{ color: statusColor, marginBottom: '0.2rem', fontSize: '0.9rem', fontWeight: 'bold' }}>{statusText}</h4>
            <p style={{ color: 'var(--text-soft)', fontSize: '0.8rem', marginBottom: '1rem' }}>Mistakes: {mistakeCount} / {maxMistakes}</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: (gameState !== 'playing') ? '1rem' : '0' }}>
                {[0, 1, 2, 3].map(i => (
                    <button 
                        key={i}
                        onClick={() => checkSwitch(i)}
                        disabled={gameState !== 'playing'}
                        className="admin-btn admin-btn--secondary"
                        style={{ padding: '0.5rem', fontSize: '0.8rem', opacity: gameState !== 'playing' ? 0.5 : 1 }}
                    >
                        Switch {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
}
