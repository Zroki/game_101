export default class Player {
    constructor(name) {
        this.name = name;
        this.score = 0;
        this.cards = [
            {
                card: 'T',
                value: 11,
            },
            {
                card: 'K',
                value: 4,
            },
            {
                card: 'D',
                value: 3,
            },
            {
                card: 'J',
                value: 2,
            },
            {
                card: '10',
                value: 10,
            },
            {
                card: '8',
                value: 8,
            },
            {
                card: '7',
                value: 7,
            },
            {
                card: '6',
                value: 6,
            },
        ];
    }
    addScore(score) {
        if (this.score + Number(score) === 101) {
            this.score = 0;
            return 0;
        } else {
            this.score += Number(score);
            return this.score;
        }
    }
    resetScore() {
        this.score = 0;
        return 0;
    }
}