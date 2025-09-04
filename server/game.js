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
        const player = { id: id.toString(), name, hand, active: true, minHandSize: 2 };
        this.players.push(player);
        return player;
    }

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
    }

    getPlayerStatus() {
        return this.players.map(p => ({
            id: p.id,
            name: p.name,
            cards: p.hand.length,
            active: p.active
        }));
    }

    makeClaim(playerId, combo) {
        const player = this.players.find(p => p.id === playerId);
        if (!player || !player.active){
            return { error: 'Inactive players cannot make claims' }
        }

        let truth;
        try {
            truth = claimExistsInPool(combo, this.players, this.pot);
        } catch (e) {
            console.error("Invalid combo: ", combo);
            truth = null;
        }

        // const player = this.players.find(p => p.id === playerId);

        const claim = {
            claimantId: playerId,
            claimantName: player ? player.name : 'Unknown',
            combo,
            truth
        };

        console.log("claim: ", claim);
        this.claims.push(claim);
        return claim;
    }

    redealHands(extraForLoserId = null) {
        // 1. Collect all player hands and pot into the deck
        for (let player of this.players) {
            this.deck.push(...player.hand);
            player.hand = [];
        }

        this.deck.push(...this.pot);
        this.pot = [];

        // 2. Shuffle the deck
        this.deck = this.shuffle(this.deck);

        // 3. Draw new pot
        this.pot = this.drawCards(3);

        // 4. Deal minimum 2 cards per player
        for (let player of this.players) {
            if (!player.active) continue;

            while (player.hand.length < player.minHandSize && this.deck.length > 0) {
                player.hand.push(this.deck.pop());
            }
            player.active = player.hand.length < 5;
        }

        // 5. Give extra card to the loser
        if (extraForLoserId) {
            const loser = this.players.find(p => p.id === extraForLoserId);
            if (loser) {
                loser.minHandSize += 1;
                if (loser.hand.length < loser.minHandSize && this.deck.length > 0) {
                    loser.hand.push(this.deck.pop());
                }
                loser.active = loser.hand.length < 5;
            }
        }

        // 6. Reset claims
        this.claims = [];
    }

    callBS(callerId) {
        const caller = this.players.find(p => p.id === callerId);
        if (!caller || !caller.active) {
            return { error: 'Inactive players cannot call BS' };
        }

        const lastClaim = this.claims[this.claims.length - 1];
        if (!lastClaim) return { error: 'No claim to call BS on' };

        const claimantId = lastClaim.claimantId; // 👈 only this line

        let loserId;
        if (lastClaim.truth === true) {
            loserId = callerId;
        } else {
            loserId = claimantId;
        }

        this.redealHands(loserId);
        this.continueGameIfNeeded();

        return {
            loserId,
            hands: this.players.map(p => ({
                id: p.id,
                hand: p.hand
            })),
            playerStatus: this.players.map(p => ({
                id: p.id,
                name: p.name,
                active: p.active,
                cards: p.hand.length
            }))
        };
    }

    getDebugState() {
        const currentPool = getCurrentPool(this.players, this.pot);

        return {
            players: this.players.map(p => ({
                id: p.id,
                name: p.name,
                hand: p.hand.map(c => `${c.rank}${c.suit}`),
                active: p.active,
                minHandSize: p.minHandSize
            })),
            pot: this.pot.map(c => `${c.rank}${c.suit}`),
            deckCount: this.deck.length,
            claims: this.claims,
            currentPool
        };
    }

    continueGameIfNeeded() {
        // Check if there are still active players
        const activePlayers = this.players.filter(p => p.active);
        
        // If no active players, do nothing (everyone is a spectator)
        if (activePlayers.length === 0) return;

        // Otherwise, start next round
        this.redealHands();  // no loser, just redeal for next round
    }

    getLastClaimant() {
        if (this.claims.length === 0) return null;
        return this.claims[this.claims.length - 1].claimantId;
    }
}

module.exports = Game;
