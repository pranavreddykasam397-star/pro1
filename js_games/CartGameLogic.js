export class CartGameLogic {
    constructor(maxMistakes = 3) {
        this.realSwitchIndex = Math.floor(Math.random() * 4);
        this.mistakeCount = 0;
        this.gameState = 'playing'; // 'playing', 'won', 'lost'
        this.maxMistakes = maxMistakes;
    }

    checkSwitch(index) {
        if (this.gameState !== 'playing') return this.gameState;

        if (index === this.realSwitchIndex) {
            this.gameState = 'won';
        } else {
            this.mistakeCount++;
            if (this.mistakeCount >= this.maxMistakes) {
                this.gameState = 'lost';
            }
        }
        return this.gameState;
    }

    reset() {
        this.realSwitchIndex = Math.floor(Math.random() * 4);
        this.mistakeCount = 0;
        this.gameState = 'playing';
    }
}
