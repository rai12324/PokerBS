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
        const player = { id: id.toString(), name, hand, active: true };
        this.players.push(player);
        return player;
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
    }

    getPlayerStatus() {
        return this.players.map(p => ({id: p.id, name: p.name, cards: p.hand.length, active: p.active}));
    }

    makeClaim(playerId, combo) {
        // Note: [truth = 1] <- the claim was valid | [truth = 0] <- the claim was invalid
        // console.log('makeClaim called with playerId:', playerId);
        // console.log('Current players:', this.players);

        let truth;
        try {
            truth = claimExistsInPool(combo, this.players, this.pot);
        } catch (e) {
            console.error("Invalid combo: ", combo);
            truth = null;
        }

        const player = this.players.find(p => p.id === playerId);
        // console.log('Found player:', player);

        const claim = {
            claimantId: playerId,
            claimantName: player ? player.name : 'Unknown',
            combo,
            truth
        };
        this.claims.push(claim);
        return claim;
    }

    // // New method: redeal all players' hands
    // redealHands(extraForLoserId = null) {
    //     // Reset deck + pot
    //     this.deck = this.createDeck();
    //     this.pot = this.drawCards(3);

    //     // Redeal hands
    //     for (let player of this.players) {
    //         player.hand = this.drawCards(2);
    //         player.active = true; // reset active status
    //     }

    //     // Give extra card to the loser
    //     if (extraForLoserId) {
    //         const loser = this.players.find(p => p.id === extraForLoserId);
    //         if (loser && this.deck.length > 0) {
    //             loser.hand.push(this.deck.pop());
    //         }
    //     }

    //     // Clear claims for new round
    //     this.claims = [];
    // }

    redealHands(extraForLoserId = null) {
        // 1. Collect all player hands into the deck
        for (let player of this.players) {
            this.deck.push(...player.hand);
            player.hand = [];
        }

        // 2. Shuffle the deck
        this.deck = this.shuffle(this.deck);

        // 3. Draw new pot
        this.pot = this.drawCards(3);

        // 4. Deal minimum 2 cards per player
        for (let player of this.players) {
            while (player.hand.length < 2 && this.deck.length > 0) {
                player.hand.push(this.deck.pop());
            }
            player.active = player.hand.length < 5;
        }

        // 5. Give extra card to the loser
        if (extraForLoserId) {
            const loser = this.players.find(p => p.id === extraForLoserId);
            if (loser && this.deck.length > 0) {
                loser.hand.push(this.deck.pop());
                loser.active = loser.hand.length < 5;
            }
        }

        // 6. Reset claims
        this.claims = [];
    }

    callBS(callerId, claimantId) {
        const claim = this.claims.find(c => c.claimantId === claimantId);
        if (!claim) return { error: 'No claim found' };

        // Determine loser carefully
        let loserId;
        if (claim.truth === true) {
            // Claim was true → caller loses
            loserId = callerId;
        } else {
            // Claim was false or invalid → claimant loses
            loserId = claimantId;
        }

        // Redeal all hands, giving extra card to loser
        this.redealHands(loserId);

        return {
            loserId,
            hands: this.players.map(p => ({
                id: p.id,
                //hand: p.hand.map(c => `${c.rank}${c.suit}`) 
                hand: p.hand
            }))
        };
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
