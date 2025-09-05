const { convertCardString, getCurrentPool, claimExistsInPool } = require('./utility'); // adjust path if needed

class Game {
    constructor() {
        this.players = []; // {id, name, hand, active}
        this.deck = this.createDeck();
        this.pot = this.drawCards(3);
        this.claims = []; // {claimantId, combo, truth}
        this.currentTurnIndex = null;
        this.isFirstRound = true;
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

        if (this.players.length === 1)
            this.currentTurnIndex = 0;

        return player;
    }

    // Helper: advance turn to next active player
    advanceTurn() {
        if (this.players.length === 0) return;
        let nextIndex = this.currentTurnIndex;
        do {
            nextIndex = (nextIndex + 1) % this.players.length;
        } while (!this.players[nextIndex].active && nextIndex !== this.currentTurnIndex);

        this.currentTurnIndex = nextIndex;
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
        const player = this.players.find((p, idx) => idx === this.currentTurnIndex);
        // Only the currentTurn player can act
        if (!player || player.id !== playerId)
            return { error: "It's not your turn" };
        if (!player.active)
            return { error: 'Inactive players cannot make claims' };

        let truth;
        try {
            truth = claimExistsInPool(combo, this.players, this.pot);
        } catch (e) {
            console.error("Invalid combo: ", combo);
            truth = null;
        }

        const claim = {
            claimantId: playerId,
            claimantName: player ? player.name : 'Unknown',
            combo,
            truth
        };

        console.log("claim: ", claim);
        this.claims.push(claim);
        this.advanceTurn();
        return claim;
    }

    redealHands(extraForLoserId = null) {
        // Collect all player hands and pot into the deck
        for (let player of this.players) {
            this.deck.push(...player.hand);
            player.hand = [];
        }
        this.deck.push(...this.pot);
        this.pot = [];

        // Shuffle deck
        this.deck = this.shuffle(this.deck);

        // Draw new pot
        this.pot = this.drawCards(3);

        // Deal min 2 cards per player
        for (let player of this.players) {
            if (!player.active) continue;
            while (player.hand.length < player.minHandSize && this.deck.length > 0) {
                player.hand.push(this.deck.pop());
            }
            player.active = player.hand.length < 5;
        }

        // Give extra card to loser
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

        // Reset claims
        this.claims = [];

        // Determine current turn
        if (this.isFirstRound) {
            this.currentTurnIndex = 0;   // First round, first player starts
            this.isFirstRound = false;
        } else if (extraForLoserId) {
            // If a loser exists, they start
            let idx = this.players.findIndex(p => p.id === extraForLoserId && p.active);
            if (idx !== -1) {
                this.currentTurnIndex = idx;
            } else {
                // If loser inactive, pick next active player
                this.currentTurnIndex = this.players.findIndex(p => p.active);
            }
        } else {
            // No loser, continue with last currentTurnIndex
            if (!this.players[this.currentTurnIndex].active) {
                // If current turn inactive, find next active player
                this.currentTurnIndex = this.players.findIndex(p => p.active);
            }
            // Otherwise, keep currentTurnIndex as-is
        }
    }

    callBS(callerId) {
        const caller = this.players.find(p => p.id === callerId);
        if (!caller || !caller.active) {
            return { error: 'Inactive players cannot call BS' };
        }

        const lastClaim = this.claims[this.claims.length - 1];
        if (!lastClaim) return { error: 'No claim to call BS on' };

        const claimantId = lastClaim.claimantId;

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
            players: this.players.map((p, idx) => ({
                id: p.id,
                name: p.name,
                hand: p.hand.map(c => `${c.rank}${c.suit}`),
                active: p.active,
                minHandSize: p.minHandSize,
                isTurn: idx === this.currentTurnIndex
            })),
            pot: this.pot.map(c => `${c.rank}${c.suit}`),
            deckCount: this.deck.length,
            claims: this.claims,
            currentPool,
            currentTurn: this.players[this.currentTurnIndex]?.id || null
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
