async function fetchState() {
    const res = await fetch('/debug/state');
    const state = await res.json();

    // Players
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = "<h2>Players</h2>" +
        state.players.map(p => `
            <div class="player">
                <strong>${p.name}</strong><br>
                ID: ${p.id}<br>
                Hand: ${JSON.stringify(p.hand)}<br>
                Active: ${p.active}
            </div>
        `).join('');

    // Pot
    document.getElementById('pot').innerHTML = "<h2>Pot</h2><pre>" +
        JSON.stringify(state.pot, null, 2) + "</pre>";

    // Claims
    document.getElementById('claims').innerHTML = "<h2>Claims</h2><pre>" +
        JSON.stringify(state.claims, null, 2) + "</pre>";

    // Deck
    // document.getElementById('deck').innerHTML = "<h2>Deck</h2><pre>" +
    //     JSON.stringify(state.deck, null, 2) + "</pre>";

    // Deck
    document.getElementById('deck').innerHTML = "<h2>Deck</h2><pre>" +
        state.deckCount + " cards remaining</pre>";

    // Current Pool
    document.getElementById('currentPool').innerHTML = "<h2>Current Pool</h2><pre>" +
        JSON.stringify(state.currentPool, null, 2) + "</pre>";
}

// Initial fetch
fetchState();
// Auto-refresh every 3 seconds
setInterval(fetchState, 3000);
