// utility.js
function wordToNumber(word) {
    const map = {
        one: 1, 1:1,
        two: 2, 2:2,
        three: 3, 3:3,
        four: 4, 4:4,
        five: 5, 5:5,
        six: 6, 6:6,
        seven: 7, 7:7,
        eight: 8, 8:8,
        nine: 9, 9:9,
        ten: 10, 10:10,
        eleven: 11, 11:11,
        twelve: 12, 12:12,
        thirteen: 13, 13:13,
        fourteen: 14, 14:14,
        fifteen: 15, 15:15,
        sixteen: 16, 16:16,
        seventeen: 17, 17:17,
        eighteen: 18, 18:18
    };
    return map[word.toLowerCase()] || null;
}

function wordOrNumberToValue(token, number_map) {
    if (!isNaN(token)) {
        return parseInt(token, 10);   // handle "2", "10", etc.
    }
    return number_map[token.toLowerCase()] || null;
}

function parseClaim(cardStr) {
    const number_map = {
        "ace": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8,
        "nine": 9, "ten": 10, "jack": 11,
        "queen": 12, "king": 13
    };

    cardStr = cardStr.toLowerCase().trim();

    // ------------------ DETECT STRAIGHT FLUSH ------------------
    // Match "straight flush ace to five" or "straight flush ace through five"
    let match = cardStr.match(/straight\s+flush\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight_flush", range: [start, end] };
    }

    // Match "flush ace to five" or "flush ace through five"
    match = cardStr.match(/flush\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight_flush", range: [start, end] };
    }

    // Match "ace to five flush" or "ace through five flush"
    match = cardStr.match(/(\w+)\s+(?:to|through)\s+(\w+)\s+flush/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight_flush", range: [start, end] };
    }

    // Match "straight flush from ace to five" or "straight from ace through five"
    match = cardStr.match(/straight\s+flush\s+(?:from\s+)?(\w+)\s+(?:to|through)\s+(\w+)/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight_flush", range: [start, end] };
    }

    // --------------------- DETECT STRAIGHT ---------------------
    // Match generic "x-card straight"
    match = cardStr.match(/(\w+)\s+card\s+straight/);
    if (match) {
        let len = parseInt(match[1]); // numeric "6"
        if (isNaN(len)) {
            len = number_map[match[1]]; // word "six"
        }
        if (!len) return null;
        return { type: "straight", length: len };
    }

    // Match "straight from ace to five" or "straight from ace through five"
    match = cardStr.match(/straight\s+from\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight", range: [start, end] };
    }

    // Match "straight ace to five" or "straight ace through five"
    match = cardStr.match(/straight\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight", range: [start, end] };
    }

    // Match "ace to nine" or "2 through 6"
    match = cardStr.match(/(\w+)\s+(?:to|through)\s+(\w+)/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight", range: [start, end] };
    }

    // Match "ace to five straight" or "ace through five straight"
    match = cardStr.match(/(\w+)\s+(?:to|through)\s+(\w+)\s+straight/);
    if (match) {
        const start = wordOrNumberToValue(match[1], number_map);
        const end = wordOrNumberToValue(match[2], number_map);
        if (!start || !end) return null;
        return { type: "straight_flush", range: [start, end] };
    }

    // Previous (More efficient way) <- update to this
    // if (!match) {
    //     // Match "straight ace to five" or "straight ace through five"
    //     match = cardStr.match(/straight\s+(\w+)\s+(?:to|through)\s+(\w+)/);
    // }

    // if (match) {
    //     console.log("In the if(match) block");
    //     const start = number_map[match[1]];
    //     const end = number_map[match[2]];
    //     if (!start || !end) return null;
    //     return { type: "straight", range: [start, end] };
    // }

    // ----------------------- DETECT FLUSH ----------------------
    // Match flush with number of cards (e.g. "six card flush")
    match = cardStr.match(/(\w+)\s+card\s+flush/);
    if (match) {
        const length = wordToNumber(match[1]);
        return { type: "flush", length };
    }

    return { type: "flush", value: convertCardString(cardStr) };
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
        "single": "1",
        "pair": "2",
        "triple": "3", "trio": "3", "trip": "3",
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

// function claimExistsInPool(claimStr, players, pot) {
//     const currentPool = getCurrentPool(players, pot).split(" ");
//     const parsed = parseClaim(claimStr);

//     console.log("In claimExistsInPool | parsed = ", parsed);

//     if (!parsed) return 0;

//     if (parsed.type === "straight_flush") {
//         const [start, end] = parsed.range;

//         // Generate needed ranks
//         const needed = [];
//         for (let i = start; i <= end; i++) needed.push(i);

//         // Group pool cards by suit
//         const poolBySuit = { H: [], D: [], C: [], S: [] };
//         currentPool.forEach(card => {
//             const rank = card.slice(0, -1);
//             const suit = card.slice(-1);
//             let val;
//             if (rank === "A") val = 1;
//             else if (rank === "J") val = 11;
//             else if (rank === "Q") val = 12;
//             else if (rank === "K") val = 13;
//             else val = Number(rank);
//             poolBySuit[suit].push(val);
//         });

//         // Check each suit if it contains all needed ranks
//         return Object.values(poolBySuit).some(ranks =>
//             needed.every(rank => ranks.includes(rank))
//         );
//     }

//     if (parsed.type === "flush") {
//             const claimedCards = parsed.value.split(" ");

//             // Debug Prints
//             console.log("From claimExistsInPool: ", claimedCards);
//             console.log("From getCurrentPool: ", currentPool);

//             // Count occurence of suits in pool
//             const suitCounts = {};
//             currentPool.forEach(card => {
//                 const suit = card.slice(-1); // last character is the suit
//                 suitCounts[suit] = (suitCounts[suit] || 0) + 1;
//             });
//             console.log("suitCounts: ", suitCounts);

//             const occurence = {};
//             claimedCards.forEach(card => {
//                 const value = card.slice(0, -1);
//                 const suit = card.slice(-1); // last character is the suit
//                 occurence[suit] = value;
//             });
//             console.log("occurence: ", occurence);

//             return Object.entries(occurence).every(([key, value]) => {
//                 return Number(value) <= (suitCounts[key] || 0);
//             });
//     }

//     if (parsed.type === "straight") {
//         console.log("In parsed.type === straight");
//         const [start, end] = parsed.range;
//         const needed = [];
//         for (let i = start; i <= end; i++) needed.push(i);

//         console.log("needed: ", needed);

//         // convert ranks in pool into numbers for easier checking
//         const poolRanks = currentPool.map(card => {
//             let val = card.slice(0, -1); // everything except suit
//             if (val === "A") return 1;
//             if (val === "J") return 11;
//             if (val === "Q") return 12;
//             if (val === "K") return 13;
//             return Number(val);
//         });

//         console.log("poolRanks: ", poolRanks);
//         console.log("Return: ", needed.every(rank => poolRanks.includes(rank)));

//         return needed.every(rank => poolRanks.includes(rank));
//     }
// }

function claimExistsInPool(claimStr, players, pot) {
    const currentPool = getCurrentPool(players, pot).split(" ");
    const parsed = parseClaim(claimStr);

    console.log("In claimExistsInPool | parsed = ", parsed);
    if (!parsed) return 0;

    // ------------------- STRAIGHT FLUSH -------------------
    if (parsed.type === "straight_flush") {
        const [start, end] = parsed.range;
        const needed = [];
        for (let i = start; i <= end; i++) needed.push(i);

        // Group pool cards by suit
        const poolBySuit = { H: [], D: [], C: [], S: [] };
        currentPool.forEach(card => {
            const rank = card.slice(0, -1);
            const suit = card.slice(-1);
            let val;
            if (rank === "A") val = 1;
            else if (rank === "J") val = 11;
            else if (rank === "Q") val = 12;
            else if (rank === "K") val = 13;
            else val = Number(rank);
            poolBySuit[suit].push(val);
        });

        // Must have all needed ranks in the same suit
        return Object.values(poolBySuit).some(ranks =>
            needed.every(rank => ranks.includes(rank))
        );
    }

    // ----------------------- FLUSH -----------------------
    if (parsed.type === "flush") {
        if (parsed.length) {
            // Case: "six card flush"
            const suitCounts = {};
            currentPool.forEach(card => {
                const suit = card.slice(-1);
                suitCounts[suit] = (suitCounts[suit] || 0) + 1;
            });
            return Object.values(suitCounts).some(count => count >= parsed.length);
        }
        if (parsed.suit) {
            // Case: "flush of clubs"
            const count = currentPool.filter(card => card.slice(-1) === parsed.suit).length;
            return count >= 5;
        } else {
            // Fallback: use convertCardString logic
            const claimedCards = parsed.value.split(" ");
            console.log("From claimExistsInPool: ", claimedCards);
            console.log("From getCurrentPool: ", currentPool);

            // Count suits in pool
            const suitCounts = {};
            currentPool.forEach(card => {
                const suit = card.slice(-1);
                suitCounts[suit] = (suitCounts[suit] || 0) + 1;
            });

            const occurence = {};
            claimedCards.forEach(card => {
                const value = card.slice(0, -1);
                const suit = card.slice(-1);
                occurence[suit] = value;
            });

            return Object.entries(occurence).every(([key, value]) => {
                return Number(value) <= (suitCounts[key] || 0);
            });
        }
    }

    // ---------------------- STRAIGHT ----------------------
    if (parsed.type === "straight") {
        // Case: "six card straight"
        if (parsed.length) {
            const values = [...new Set(currentPool.map(card => {
                let val = card.slice(0, -1);
                if (val === "A") return 1;
                if (val === "J") return 11;
                if (val === "Q") return 12;
                if (val === "K") return 13;
                return Number(val);
            }))].sort((a, b) => a - b);

            // Look for any run of N consecutive values
            for (let i = 0; i <= values.length - parsed.length; i++) {
                let run = 1;
                for (let j = i; j < values.length - 1; j++) {
                    if (values[j + 1] === values[j] + 1) {
                        run++;
                        if (run >= parsed.length) return true;
                    } else break;
                }
            }
            return false;
        }

        // Case: "straight ace to five"
        if (parsed.range) {
            const [start, end] = parsed.range;
            const needed = [];
            for (let i = start; i <= end; i++) needed.push(i);

            const poolRanks = currentPool.map(card => {
                let val = card.slice(0, -1);
                if (val === "A") return 1;
                if (val === "J") return 11;
                if (val === "Q") return 12;
                if (val === "K") return 13;
                return Number(val);
            });

            return needed.every(rank => poolRanks.includes(rank));
        }
    }

    return false;
}

module.exports = { convertCardString, getCurrentPool, claimExistsInPool };
