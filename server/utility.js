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
    // if (parts.length !== 2) throw new Error("Input should be 'number suit'");

    // const [number, suit] = parts;
    // let number = null;
    // let suit = null;
    let claim = "";

    for (const part of parts) {
        if (number_map[part])
            claim = claim + number_map[part];
        else if(suit_map[part])
            claim = claim + suit_map[part];
    }

    // if (!number || !suit) {
    //     throw new Error("Invalid input: " + cardStr);
    // }

    console.log(claim);
    return claim;
}

function getCurrentPool(players, pot) {
    const playerHands = players.flatMap(p => p.hand.map(c => `${c.rank}${c.suit}`));
    const potCards = pot.map(c => `${c.rank}${c.suit}`);
    return [...playerHands, ...potCards].join(' ');
}

module.exports = { convertCardString, getCurrentPool };
