const { convertCardString, getCurrentPool, claimExistsInPool } = require('./utility'); // adjust path if needed

class Game {
    constructor() {
        this.players = []; // {id, name, hand, active}
        this.deck = this.createDeck();
        this.pot = this.drawCards(3);
        this.claims = []; // {claimantId, combo, truth}
    }

    createDeck() {
        const suits = ['H','D','C','S'];
        const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
        let deck = [];
        for (let s of suits) {
            for (let r of ranks) deck.push({rank: r, suit: s});
        }
        return this.shuffle(deck);
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    drawCards(n) {
        return this.deck.splice(0, n);
    }

    addPlayer(id, name) {
        const hand = this.drawCards(2);
        const player = { id, name, hand, active: true };
        this.players.push(player);
        return player;
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
    }

    getPlayerStatus() {
        return this.players.map(p => ({name: p.name, cards: p.hand.length, active: p.active}));
    }

    makeClaim(playerId, combo) {
        // Note: [truth = 1] <- the claim was valid | [truth = 0] <- the claim was invalid
        
        let truth;
        try {
            truth = claimExistsInPool(combo, this.players, this.pot);
        } catch (e) {
            console.error("Invalid combo: ", combo);
            truth = null;
        }

        const claim = {claimantId: playerId, combo, truth};
        this.claims.push(claim);
        return claim;
    }

    callBS(callerId, claimantId) {
        const claim = this.claims.find(c => c.claimantId === claimantId);
        if (!claim) return {error:'No claim found'};
        let loserId = claim.truth ? callerId : claimantId;
        let loser = this.players.find(p => p.id === loserId);
        if (loser && this.deck.length > 0) {
            loser.hand.push(this.deck.pop());
            if (loser.hand.length >= 5) loser.active = false;
        }
        return {loserId, loserHandCount: loser.hand.length};
    }

    // inside Game class
    getDebugState() {
        const currentPool = getCurrentPool(this.players, this.pot);

        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                hand: p.hand.map(c => `${c.rank}${c.suit}`),
                active: p.active
            })),
            pot: this.pot.map(c => `${c.rank}${c.suit}`),
            deckCount: this.deck.length,
            claims: this.claims,
            currentPool
        };
    }
}

module.exports = Game;
