export class DiscountGamesUI {
    constructor(container, onWin) {
        this.container = container;
        this.onWin = onWin;
        
        // Game State
        this.phase = 'switch'; // 'intro', 'switch', 'clicker', 'won', 'lost'
        
        // Switch Game State
        this.maxMistakes = 3;
        this.mistakes = 0;
        this.realSwitchIndex = Math.floor(Math.random() * 4);
        this.switchesState = [false, false, false, false];
        
        // Clicker Game State
        this.clicks = 0;
        this.maxClicks = 50;
        this.timeLeft = 15;
        this.timer = null;
        this.clickerActive = false;
        
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'game-ui-wrapper';
        
        const card = document.createElement('div');
        card.className = 'game-card';
        this.container.appendChild(card);
        
        if (this.phase === 'switch') {
            this.renderSwitchPhase(card);
        } else if (this.phase === 'clicker') {
            this.renderClickerPhase(card);
        } else if (this.phase === 'won') {
            this.renderWonPhase(card);
        } else if (this.phase === 'lost') {
            this.renderLostPhase(card);
        }
    }

    renderSwitchPhase(card) {
        card.innerHTML = `
            <div class="game-header">
                <h3>Phase 1: Guess the Switch</h3>
                <p>Find the working switch to proceed. You have ${this.maxMistakes - this.mistakes} attempts left!</p>
            </div>
            <div class="switch-grid"></div>
        `;
        
        const grid = card.querySelector('.switch-grid');
        for (let i = 0; i < 4; i++) {
            const btn = document.createElement('button');
            btn.className = 'switch-btn';
            if (this.switchesState[i]) {
                btn.classList.add('error');
            }
            btn.innerHTML = `<span class="switch-toggle"></span>`;
            
            btn.addEventListener('click', () => {
                if (this.switchesState[i]) return; // already tried
                
                if (i === this.realSwitchIndex) {
                    btn.classList.add('success');
                    setTimeout(() => {
                        this.phase = 'clicker';
                        this.render();
                    }, 800);
                } else {
                    this.switchesState[i] = true;
                    this.mistakes++;
                    btn.classList.add('error');
                    
                    if (this.mistakes >= this.maxMistakes) {
                        setTimeout(() => {
                            this.phase = 'lost';
                            this.render();
                        }, 500);
                    } else {
                        // Re-render to update mistakes count
                        setTimeout(() => this.render(), 300);
                    }
                }
            });
            grid.appendChild(btn);
        }
    }

    renderClickerPhase(card) {
        card.innerHTML = `
            <div class="game-header">
                <h3>Phase 2: Speed Clicker</h3>
                <p>Click the button ${this.maxClicks} times in ${this.timeLeft} seconds!</p>
            </div>
            <div class="clicker-stats">
                <div class="stat-box timer-box">
                    <span class="label">Time Left</span>
                    <span class="value" id="game-timer">${this.timeLeft}s</span>
                </div>
                <div class="stat-box">
                    <span class="label">Clicks</span>
                    <span class="value" id="game-clicks">${this.clicks}/${this.maxClicks}</span>
                </div>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" id="game-progress" style="width: ${(this.clicks/this.maxClicks)*100}%"></div>
            </div>
            <button class="clicker-btn" id="game-clicker-btn">
                ${this.clickerActive ? 'CLICK ME FAST!' : 'START'}
            </button>
        `;
        
        const btn = card.querySelector('#game-clicker-btn');
        btn.addEventListener('click', () => {
            if (!this.clickerActive) {
                this.startClicker();
                btn.innerText = 'CLICK ME FAST!';
            } else {
                this.clicks++;
                card.querySelector('#game-clicks').innerText = `${this.clicks}/${this.maxClicks}`;
                card.querySelector('#game-progress').style.width = `${(this.clicks/this.maxClicks)*100}%`;
                
                // Add pop animation
                btn.classList.remove('pop');
                void btn.offsetWidth; // trigger reflow
                btn.classList.add('pop');
                
                if (this.clicks >= this.maxClicks) {
                    this.endClicker(true);
                }
            }
        });
    }

    startClicker() {
        this.clickerActive = true;
        this.timer = setInterval(() => {
            this.timeLeft--;
            const timerEl = this.container.querySelector('#game-timer');
            if (timerEl) timerEl.innerText = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 0) {
                this.endClicker(false);
            }
        }, 1000);
    }

    endClicker(won) {
        clearInterval(this.timer);
        this.clickerActive = false;
        
        if (won) {
            this.phase = 'won';
            this.onWin();
        } else {
            this.phase = 'lost';
        }
        this.render();
    }

    renderWonPhase(card) {
        card.innerHTML = `
            <div class="game-result success-result">
                <div class="icon">🏆</div>
                <h3>Discount Unlocked!</h3>
                <p>Great job! You have won the challenge.</p>
            </div>
        `;
    }

    renderLostPhase(card) {
        card.innerHTML = `
            <div class="game-result error-result">
                <div class="icon">💔</div>
                <h3>Game Over</h3>
                <p>Better luck next time!</p>
                <button class="retry-btn">Try Again</button>
            </div>
        `;
        
        card.querySelector('.retry-btn').addEventListener('click', () => {
            // Reset state
            this.phase = 'switch';
            this.mistakes = 0;
            this.realSwitchIndex = Math.floor(Math.random() * 4);
            this.switchesState = [false, false, false, false];
            this.clicks = 0;
            this.timeLeft = 15;
            this.clickerActive = false;
            this.render();
        });
    }
}
