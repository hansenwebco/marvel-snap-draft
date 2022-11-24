import { Base64 } from 'js-base64';
import 'bootstrap/dist/css/bootstrap.min.css';
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
import { pick } from 'query-string';


let pickCard = 0;
let pick2 = 0;
let pick3 = 0;
let currentPick = 1;
let pickList = "";
let cardsPicked = [];
let socket;
let voteSession = "";
let cards;
let draftMode = 0;

const DATA_URL = "https://snapdata.stonedonkey.com/";
const SIGNALIO_SERVER = "wss://stone-donkey.onrender.com"
//const SIGNALIO_SERVER = "ws://localhost:3000";


function start(mode) {
    draftMode = mode;
    document.getElementById("start-screen").style.display = "none";
    document.getElementById("draft-ui").style.display = "block";
    document.getElementById("picks-ui").style.display = "block";
    if (draftMode == 1) {
        configureSealed();
        //updatePicksSealed();

    }
    else
        updatePicks();
}

async function loadCards() {
    let result = await (await fetch(DATA_URL + "data/snap.json")).json();
    cards = result.data.cards;
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
        chose = pickCard;
    else if (card === 2)
        chose = pick2;
    else if (card === 3)
        chose = pick3;

    pickList += "|" + chose;

    cardsPicked.push(cards.card.find(x => parseInt(x.id) === chose));

    sortCards();

    drawPicks();

    currentPick++;
    if (draftMode == 1)
        s1UpdatePicks(cards);
    else
        updatePicks();

    let deckCode = buildDeckCode();

    if (currentPick > 12) {
        document.getElementById("picks").style.display = "none";
        document.getElementById("picks-complete").style.display = "block";
        document.getElementById("totalvotes").style.display = "none";
        return;
    }
}

export function randomNum(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updatePicks() {

    let totalCards = cards.card.length;

    do {
        pickCard = randomNum(1, totalCards);
    } while (pickList.indexOf("|" + pickCard) >= 0 || cards.card[pickCard - 1].released === false)

    do {
        pick2 = randomNum(1, totalCards);
    } while ((pickCard === pick2 || pickList.indexOf("|" + pick2) >= 0) || cards.card[pick2 - 1].released === false);

    do {
        pick3 = randomNum(1, totalCards);
    } while ((pickCard === pick3 || pick2 === pick3 || pickList.indexOf("|" + pick3) >= 0) || cards.card[pick3 - 1].released === false);

    document.getElementById("pick1").src = DATA_URL + "images/cards/" + pickCard + ".webp";
    document.getElementById("pick2").src = DATA_URL + "images/cards/" + pick2 + ".webp";
    document.getElementById("pick3").src = DATA_URL + "images/cards/" + pick3 + ".webp";


    document.querySelectorAll('.outofdate').forEach(e => e.remove());
    if (cards.card[pickCard - 1].currentImage === false)
        drawOutOfDate(1);
    if (cards.card[pick2 - 1].currentImage === false)
        drawOutOfDate(2);
    if (cards.card[pick3 - 1].currentImage === false)
        drawOutOfDate(3);

    document.getElementById("card-desc-1").innerHTML = cards.card[pickCard - 1].desc;
    document.getElementById("card-desc-2").innerHTML = cards.card[pick2 - 1].desc;
    document.getElementById("card-desc-3").innerHTML = cards.card[pick3 - 1].desc;

    if (voteSession.length > 0)
        ioEmitState();

}

// called when the user says they already have a card
// this can probably be combined with updatePicks somehow but I can't be bothered...
function updateCard(redraw) {

    let totalCards = cards.card.length;

    if (redraw === 1)
        do {
            pickCard = randomNum(1, totalCards);
        } while (pickCard === pick2 || pickCard === pick3 || pickList.indexOf("|" + pickCard) >= 0 || cards.card[pickCard - 1].released === false);
    else if (redraw === 2)
        do {
            pick2 = randomNum(1, totalCards);
        } while (pickCard === pick2 || pick2 === pick3 || pickList.indexOf("|" + pick2) >= 0 || cards.card[pick2 - 1].released === false);
    else if (redraw === 3)
        do {
            pick3 = randomNum(1, totalCards);
        } while (pickCard === pick3 || pick2 === pick3 || pickList.indexOf("|" + pick3) >= 0 || cards.card[pick3 - 1].released === false);


    document.getElementById("pick1").src = DATA_URL + "images/cards/" + pickCard + ".webp";
    document.getElementById("pick2").src = DATA_URL + "images/cards/" + pick2 + ".webp";
    document.getElementById("pick3").src = DATA_URL + "images/cards/" + pick3 + ".webp";

    document.querySelectorAll('.outofdate').forEach(e => e.remove());
    if (cards.card[pickCard - 1].currentImage === false)
        drawOutOfDate(1);
    if (cards.card[pick2 - 1].currentImage === false)
        drawOutOfDate(2);
    if (cards.card[pick3 - 1].currentImage === false)
        drawOutOfDate(3);

    document.getElementById("card-desc-1").innerHTML = cards.card[pickCard - 1].desc;
    document.getElementById("card-desc-2").innerHTML = cards.card[pick2 - 1].desc;
    document.getElementById("card-desc-3").innerHTML = cards.card[pick3 - 1].desc;

    if (voteSession.length > 0)
        ioEmitState();

}

function drawOutOfDate(cardId) {
    const newDiv = document.createElement("img");
    newDiv.classList.add("outofdate");
    newDiv.src = "./images/outofdate.png";
    document.getElementById("card-" + cardId + "-td").appendChild(newDiv);
}

function drawPicks() {

    for (var x = 0; x < cardsPicked.length; x++) {
        document.getElementById("card" + (x + 1)).src = DATA_URL + "images/cards/" + cardsPicked[x].id + ".webp";
    }

    for (var y = 0; y < 6; y++) {

        var count = cardsPicked.filter(elm => {
            return elm.energy == (y + 1)
        }
        ).length;

        document.getElementById("energy" + (y + 1)).style.height = 1 + count * 10 + "px";
    }

}

function buildDeckCode() {

    let deck = {};
    deck.Cards = [];
    deck.Name = "Draft Deck"

    for (var x = 0; x < cardsPicked.length; x++) {
        const replaced = cardsPicked[x].name.replace(/[^a-z0-9]/gi, '');
        deck.Cards[x] = { "CardDefId": replaced };
    }

    let result = Base64.btoa(JSON.stringify(deck));
    document.getElementById("deck-code").value = result;
}

function copyDeckCode() {
    let code = document.getElementById("deck-code").value;
    navigator.clipboard.writeText(code);
}

function drawVotes(arg) {
    let totalVotes = arg.votes.length === undefined ? 0 : arg.votes.length;

    let viewers = arg.viewers;
    document.getElementById("totalvotes").innerHTML = "Viewers " + viewers + " - Total Votes: " + (totalVotes === undefined ? 0 : totalVotes)

    if (totalVotes && totalVotes > 0) {
        document.getElementById("vote-1").innerHTML = Math.round(((arg.votes.filter(elm => elm.pick === 1).length / totalVotes) * 100)) + "%";
        document.getElementById("vote-2").innerHTML = Math.round(((arg.votes.filter(elm => elm.pick === 2).length / totalVotes) * 100)) + "%";
        document.getElementById("vote-3").innerHTML = Math.round(((arg.votes.filter(elm => elm.pick === 3).length / totalVotes) * 100)) + "%";
    }
    else {
        document.getElementById("vote-1").innerHTML = "0%";
        document.getElementById("vote-2").innerHTML = "0%";
        document.getElementById("vote-3").innerHTML = "0%";
    }
}

function ioStartStreamVote() {

    // TODO: Deal with this
    socket = io(SIGNALIO_SERVER);

    socket.on("stateupdate", (arg) => {
        document.getElementById("vote-details-master").style.display = "block";
        drawVotes(arg);
    })


    voteSession = uuidv4();

    let message = {};
    message.type = "connect";
    message.session = voteSession;
    message.user = uuidv4();

    socket.emit("message", message);

    let url = new URL(location.pathname, location.href).href
    document.getElementById("vote-url").value = url + "vote.html?id=" + voteSession;

    [...document.getElementsByClassName("vote-master")].forEach(
        (element, index, array) => {
            element.style.display = "block";
        }
    );

    ioEmitState();
}


function toggleLive() {
    let tab = document.getElementById("live-start");
    tab.style.display = (tab.style.display === "block") ? "none" : "block";
    document.getElementById("live-tab").innerHTML = (tab.style.display === "none") ? "Draft With Friends (BETA)" : "Close";
}

function ioEmitState() {
    let state = {};
    state.pick1 = pickCard;
    state.pick2 = pick2;
    state.pick3 = pick3;
    state.session = voteSession;
    state.cardsPicked = cardsPicked;
    socket.emit("updatestate", state);
}

function sortCards() {
    cardsPicked.sort((a, b) => a.name > b.name ? 1 : -1)
    cardsPicked.sort((a, b) => a.power - b.power);
    cardsPicked.sort((a, b) => a.energy - b.energy);
}

// sealed mode /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let packCount = 5;
let cardsOpened = [];
let cardReveals = 0;
function configureSealed() {
    document.getElementById("picks").style.display = "none";
    document.getElementById("draft").style.display = "none";
    document.getElementById("picks-sealed").style.display = "block";
    document.getElementById("open-packs").style.display = "block";

    bindClick();
}

function openPack() {

    if (packCount >= 1) {

        new Audio('./sound/pack-open2.wav').play();

        packCount--;

        if (packCount == 0) {
            // TODO : remove event click for more packs
            document.getElementById("seasonpack").src = "./images/trans.png";
        }

        document.getElementById("packcount").innerHTML = packCount + " Packs Remaining";

        cardReveals = 0;
        [...document.getElementsByClassName("cardback")].forEach(
            (element, index, array) => {

                element.src = "./images/cardback-full.png";
                element.classList.forEach(item => {
                    if (item.startsWith('pick-rarity')) {
                        element.classList.remove(item);
                    }
                });
            }
        );
    }

}

function bindClick() {
    [...document.getElementsByClassName("cardback")].forEach(
        (element, index, array) => {
            element.addEventListener("click", function handler() {
                if (this.src.includes("cardback-full.png")) {
                    let pick = drawCard();
                    this.src = DATA_URL + "images/cards/" + cards.card[pick].id + ".webp";
                    this.classList.add("pick-rarity-" + cards.card[pick].draftRarity);
                    new Audio('./sound/card-open.wav').play();
                    cardReveals++;
                    if (packCount == 0 && cardReveals == 5) {
                        drawSealed();
                    }
                }
            })
        })
}

function drawCard() {
    let totalCards = cards.card.length;

    var pickRarity = randomNum(1, 100);
    var rarity = 1;
    if (pickRarity > 64 && pickRarity < 96)
        rarity = 2;
    else if (pickRarity >= 97)
        rarity = 3;

    let cardPicked = 0;
    do {
        let pickCard = randomNum(1, totalCards);
        if (cards.card[pickCard - 1].released == true && cards.card[pickCard - 1].draftRarity == rarity) {
            console.log("card added");
            cardsOpened.push(cards.card[pickCard]);
            cardPicked = pickCard;
        }
    }
    while (cardPicked == 0);

    return cardPicked;
}

function sortOpened() {

    cardsOpened.sort((a, b) => a.name > b.name ? 1 : -1)
    cardsOpened.sort((a, b) => a.power - b.power);
    cardsOpened.sort((a, b) => a.energy - b.energy);
}

function drawSealed() {

    document.getElementById("open-packs").style.display = "none";
    document.getElementById("draft").style.display = "";
    document.getElementById("draft-ui").style.display = "block";

    sortOpened();

    let table = document.getElementById("picks-sealed");
   
    for(var i = 0;i<table.rows.length;){
        table.deleteRow(i);
    }

    let tr = table.insertRow(0);

    let cells = 0;
    let lastCard = 0;
    for (var x = 0; x < cardsOpened.length; x++) {

        if (cardsOpened[x].id != lastCard) {

            cells++;

            let td = tr.insertCell(-1);
            let img = document.createElement("img");

            img.src = DATA_URL + "images/cards/" + cardsOpened[x].id + ".webp";
            img.classList.add("sealed-card");
            img.classList.add("pick-rarity-" + cardsOpened[x].draftRarity);
            img.setAttribute("cardid", cardsOpened[x].id);

            img.addEventListener("click", function handler() {
                //console.log(this.getAttribute("cardid"));
                cardsPicked.push(cards.card.find(x => parseInt(x.id) === parseInt(this.getAttribute("cardid"))));
                
                // TODO: this isn't working properly
                cardsOpened.splice(cardsOpened.find(x => parseInt(x.id) === parseInt(this.getAttribute("cardid"))),1);
                            
                sortOpened();
                drawPicks();
                drawSealed();
            })

            td.appendChild(img);

            if (cells >= 8) {
                tr = table.insertRow(-1);
                cells = 0;
            }

            lastCard = cardsOpened[x].id;

        }
    }

}
// end sealed mode /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// public functions
window.updatePicks = updatePicks;
window.chooseCard = chooseCard;
window.updateCard = updateCard;
window.copyDeckCode = copyDeckCode;
window.ioStartStreamVote = ioStartStreamVote;
window.toggleLive = toggleLive;
window.loadCards = loadCards;
window.start = start;

window.openPack = openPack;