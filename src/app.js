import { Base64 } from 'js-base64';
import 'bootstrap/dist/css/bootstrap.min.css';

let pick1 = 0;
let pick2 = 0;
let pick3 = 0;
let currentPick = 1;
let pickList = "";
let cardsPicked = [];

window.onload = function () {
    updatePicks();
}

function chooseCard(card) {

    document.getElementById("pick1").src = "";
    document.getElementById("pick2").src = "";
    document.getElementById("pick3").src = "";

    document.getElementById("pick1").setAttribute("onclick", "");
    document.getElementById("pick2").setAttribute("onclick", "");
    document.getElementById("pick3").setAttribute("onclick", "");

    let chose = 0;
    if (card === 1)
        chose = pick1;
    else if (card === 2)
        chose = pick2;
    else if (card === 3)
        chose = pick3;

    pickList += "|" + chose;

    cardsPicked.push(cards.card.find(x => parseInt(x.id) === chose));
    
    
    cardsPicked.sort((a, b) => a.name > b.name ? 1 : -1)
    cardsPicked.sort((a, b) => a.power - b.power);
    cardsPicked.sort((a, b) => a.energy - b.energy);

    drawPicks();

    currentPick++;
    updatePicks();

    let deckCode = buildDeckCode();

    if (currentPick > 12) {
        document.getElementById("picks").style.display = "none";
        document.getElementById("picks-complete").style.display = "block";
        return;
    }
}

function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// called when the user says they already have a card
// this can probably be combined with updatePicks somehow but I can't be bothered...
function redraw(redraw) {

    let totalCards = cards.card.length;

    if (redraw === 1)
        do {
            pick1 = randomNum(1, totalCards);
        } while (pick1 === pick2 || pick1 === pick3 || pickList.indexOf("|" + pick1) >= 0)
    else if (redraw === 2)
        do {
            pick2 = randomNum(1, totalCards);
        } while (pick1 === pick2 || pick2 === pick3 || pickList.indexOf("|" + pick2) >= 0);
    else if (redraw === 3)
        do {
            pick3 = randomNum(1, totalCards);
        } while (pick1 === pick3 || pick2 === pick3 || pickList.indexOf("|" + pick3) >= 0);


    document.getElementById("pick1").src = "./images/" + pick1 + ".webp";
    document.getElementById("pick2").src = "./images/" + pick2 + ".webp";
    document.getElementById("pick3").src = "./images/" + pick3 + ".webp";

    document.getElementById("card-desc-1").innerHTML = cards.card[pick1-1].desc;
    document.getElementById("card-desc-2").innerHTML = cards.card[pick2-1].desc;
    document.getElementById("card-desc-3").innerHTML = cards.card[pick3-1].desc;
}

function updatePicks() {

    let totalCards = cards.card.length;


    do {
        pick1 = randomNum(1, totalCards);
    } while (pickList.indexOf("|" + pick1) >= 0)

    do {
        pick2 = randomNum(1, totalCards);
    } while (pick1 === pick2 || pickList.indexOf("|" + pick2) >= 0);

    do {
        pick3 = randomNum(1, totalCards);
    } while (pick1 === pick3 || pick2 === pick3 || pickList.indexOf("|" + pick3) >= 0);

    document.getElementById("pick1").src = "./images/" + pick1 + ".webp";
    document.getElementById("pick2").src = "./images/" + pick2 + ".webp";
    document.getElementById("pick3").src = "./images/" + pick3 + ".webp";

    document.getElementById("card-desc-1").innerHTML = cards.card[pick1-1].desc;
    document.getElementById("card-desc-2").innerHTML = cards.card[pick2-1].desc;
    document.getElementById("card-desc-3").innerHTML = cards.card[pick3-1].desc;
    

}

function drawPicks() {
    for (var x = 0; x < cardsPicked.length; x++) {
        document.getElementById("card" + (x + 1)).src = "./images/" + cardsPicked[x].id + ".webp";
    }

    for (var y = 0; y < 6; y++) {

        var count = cardsPicked.filter(elm => {
            return elm.energy == (y + 1)
        }
        ).length;

        document.getElementById("energy" + (y + 1)).style.height = 1+ count * 10 + "px";
    }

}

function buildDeckCode() {

    let deck = {};
    deck.Cards = [];
    deck.Name = "Draft Deck"

    for (var x = 0; x < cardsPicked.length; x++) {
        const replaced = cardsPicked[x].name.replace(/[^a-z0-9]/gi, '');
        deck.Cards[x] = { "CardDefId" : replaced };
    }


    let result = Base64.btoa(JSON.stringify(deck));
    document.getElementById("deck-code").value = result;
   
}

function copyDeckCode() {
    let code =  document.getElementById("deck-code").value;
    navigator.clipboard.writeText(code);
}

window.updatePicks = updatePicks;
window.chooseCard = chooseCard;
window.redraw = redraw;
window.copyDeckCode =copyDeckCode;