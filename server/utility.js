// utility.js
function convertCardString(cardStr) {
    const number_map = {
        "one": "1", "two": "2", "three": "3", "four": "4",
        "five": "5", "six": "6", "seven": "7", "eight": "8",
        "nine": "9", "ten": "10", "jack": "J", "queen": "Q", "king": "K", "ace": "A"
    };
    const suit_map = {
        "hearts": "H", "diamonds": "D", "clubs": "C", "spades": "S"
    };

    const parts = cardStr.toLowerCase().split(' ');
    let claim = "";

    for (const part of parts) {
        if (number_map[part])
            claim = claim + number_map[part];
        else if(suit_map[part])
            claim = claim + suit_map[part] + ' ';
    }

    console.log("In convertCardString: ", claim);
    claim = claim.trim()
    return claim;
}

function getCurrentPool(players, pot) {
    const playerHands = players.flatMap(p => p.hand.map(c => `${c.rank}${c.suit}`));
    const potCards = pot.map(c => `${c.rank}${c.suit}`);
    return [...playerHands, ...potCards].join(' ');
}

function claimExistsInPool(claimStr, players, pot) {
    // Return 1 if yay | Return 0 if nay

    const claimedCards = convertCardString(claimStr).split(" "); // array of claimed cards
    console.log("From claimExistsInPool: ", claimedCards);

    const currentPool = getCurrentPool(players, pot).split(" "); // array of cards
    console.log("From getCurrentPool: ", currentPool);

    // Count suits in pool
    const suitCounts = {};
    currentPool.forEach(card => {
        const suit = card.slice(-1); // last character is the suit
        suitCounts[suit] = (suitCounts[suit] || 0) + 1;
    });
    console.log("suitCounts: ", suitCounts);

    const occurence = {};
    claimedCards.forEach(card => {
        const value = card.slice(0, -1);
        const suit = card.slice(-1); // last character is the suit
        occurence[suit] = value;
    });
    console.log("occurence: ", occurence);

    return Object.entries(occurence).every(([key, value]) => {
        return Number(value) <= (suitCounts[key] || 0);
    });
}

module.exports = { convertCardString, getCurrentPool, claimExistsInPool };
