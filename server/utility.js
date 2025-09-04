// utility.js
function parseClaim(cardStr) {
    const number_map = {
        "ace": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8,
        "nine": 9, "ten": 10, "jack": 11,
        "queen": 12, "king": 13
    };

    cardStr = cardStr.toLowerCase().trim();

    // Match "straight from ace to five" or "straight from ace through five"
    let match = cardStr.match(/straight\s+from\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    if (!match) {
        // Match "straight ace to five" or "straight ace through five"
        match = cardStr.match(/straight\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    }

    console.log("1. parseClaim -> match = ", match);

    if (match) {
        console.log("In the if(match) block");
        const startWord = match[1];
        const endWord = match[2];
        const start = number_map[startWord];
        const end = number_map[endWord];

        console.log("startWord [", startWord, "] endWord [", endWord, "] start [", start, "] end [", end, "]"); // works
        
        if (!start || !end) {
            console.warn("Invalid straight claim:", cardStr);
            return null;
        }

        return { type: "straight", range: [start, end] };
    }

    // Implicit straight: "ace to nine" / "2 through 6"
    match = cardStr.match(/(\w+)\s+(?:to|through)\s+(\w+)/);
    console.log("2. parseClaim -> match = ", match);
    if (match) {
        const start = number_map[match[1]];
        const end = number_map[match[2]];

        console.log(" start [", start, "] end [", end, "]");

        if (!start || !end) return null;
        return { type: "straight", range: [start, end] };
    }

    // fallback for your old single-card logic...
    return { type: "card", value: convertCardString(cardStr) };
}

function convertCardString(cardStr) {
    const number_map = {
        "one": "1", "two": "2", "three": "3", "four": "4",
        "five": "5", "six": "6", "seven": "7", "eight": "8",
        "nine": "9", "ten": "10", "eleven": "11", "twelve": "12",
        "thirteen": "13", "fourteen": "14", "fifteen": "15",
        "sixteen": "16"
    };

    const hand_type_map = {
        "pair": "2",
        "triple": "3", "trio": "3",
        "quad": "4",
        "flush": "5"
    };

    const suit_map = {
        "hearts": "H", "heart": "H",
        "diamonds": "D", "diamond": "D",
        "clubs": "C", "club": "C",
        "spades": "S", "spade": "S"
    };

    cardStr = cardStr.toLowerCase().replace(/card flush/g, "");
    const parts = cardStr.toLowerCase().split(' ');
    let claim = "";

    for (const part of parts) {
        if (number_map[part])
            claim = claim + number_map[part];
        else if (hand_type_map[part])
            claim = claim + hand_type_map[part];
        else if(suit_map[part])
            claim = claim + suit_map[part] + ' ';
        else
            continue;
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
    const currentPool = getCurrentPool(players, pot).split(" ");
    const parsed = parseClaim(claimStr);

    console.log("In claimExistsInPool | parsed = ", parsed);

    if (!parsed) return 0;

    if (parsed.type === "card") {
            // Return 1 if yay | Return 0 if nay
            // const claimedCards = convertCardString(claimStr).split(" "); // array of claimed cards
            const claimedCards = parsed.value.split(" ");
            console.log("From claimExistsInPool: ", claimedCards);

            // const currentPool = getCurrentPool(players, pot).split(" "); // array of cards
            console.log("From getCurrentPool: ", currentPool);

            // Count occurence of suits in pool
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

    if (parsed.type === "straight") {
        console.log("In parsed.type === straight");
        const [start, end] = parsed.range;
        const needed = [];
        for (let i = start; i <= end; i++) needed.push(i);

        console.log("needed: ", needed);

        // convert ranks in pool into numbers for easier checking
        const poolRanks = currentPool.map(card => {
            let val = card.slice(0, -1); // everything except suit
            if (val === "A") return 1;
            if (val === "J") return 11;
            if (val === "Q") return 12;
            if (val === "K") return 13;
            return Number(val);
        });

        console.log("poolRanks: ", poolRanks);
        console.log("Return: ", needed.every(rank => poolRanks.includes(rank)));

        return needed.every(rank => poolRanks.includes(rank));
    }
}

module.exports = { convertCardString, getCurrentPool, claimExistsInPool };
