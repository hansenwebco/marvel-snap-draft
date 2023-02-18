import { Base64 } from 'js-base64';
import 'bootstrap/dist/css/bootstrap.min.css';
import { v4 as uuidv4 } from 'uuid';
import { io } from "socket.io-client";
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light-border.css';

var PACKAGE = require('../package.json');

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

const DATA_URL = "https://snapdata-cdn.stonedonkey.com/";
const SIGNALIO_SERVER = "wss://stone-donkey.onrender.com"
//const SIGNALIO_SERVER = "ws://localhost:3000";


function start(mode) {
    draftMode = mode;

    // TODO: Remove these
    //document.getElementById("picks").style.display = "none";
    //document.getElementById("picks-complete").style.display = "block";

    document.getElementById("start-screen").style.display = "none";
    document.getElementById("draft-ui").style.display = "block";
    document.getElementById("picks-ui").style.display = "block";
    document.getElementById("notice").style.display = "none";
    if (draftMode == 1) {
        configureSealed();
    }
    else {
        updatePicks();
        document.getElementById("live").style.display = "inline-block";
    }
}

async function loadCards() {

    document.getElementById("version").innerHTML = "v" + PACKAGE.version;

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

        saveDraftToDb(pickList, 'arena');
        return;
    }
}

function saveDraftToDb(pickList, mode) {

    let payload = JSON.stringify({ 'draft': pickList, 'mode': mode });

    fetch('https://snapbot.stonedonkey.com/draft', {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: payload,
        cache: 'default'
    })
        .then((response) => response.json())
        .then((data) => {
            console.log('Success:', data.draftid);
            document.getElementById("draftlink").value = "https://www.marvelsnapdraft.com/?draft=" + data.draftid;
        })
}


export function randomNum(min, max) {
    //return Math.floor(Math.random() * (max - min + 1)) + min;
    return Math.floor(Math.random() * (max - min)) + min;
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

    // console.log(pickCard,pick2, pick3)
    // console.log(cards.card[pickCard - 1].name)
    // console.log(cards.card[pick2 - 1].name)
    // console.log(cards.card[pick3 - 1].name)

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

    for (var x = 0; x < 12; x++) {
        document.getElementById("card" + (x + 1)).src = "./images/blank2.png";
        document.getElementById("card" + (x + 1)).removeAttribute("cardid");
        document.getElementById("card" + (x + 1)).classList.remove("pointer");
    }

    for (var x = 0; x < cardsPicked.length; x++) {
        document.getElementById("card" + (x + 1)).src = DATA_URL + "images/cards/" + cardsPicked[x].id + ".webp";
        document.getElementById("card" + (x + 1)).setAttribute("cardid", cardsPicked[x].id);
        if (draftMode == 1) {
            document.getElementById("card" + (x + 1)).classList.add("pointer");
        }
        // add tooltaips
        document.getElementById("card" + (x + 1)).setAttribute("data-tippy-content", cardsPicked[x].desc);
    }

    bindToolTips();

    for (var y = 0; y < 6; y++) {
        var count = cardsPicked.filter(elm => {
            return elm.energy == (y + 1)
        }
        ).length;
        document.getElementById("energy" + (y + 1)).style.height = 1 + count * 10 + "px";
    }


    if (draftMode == 1 && cardsPicked.length >= 12) {
        document.getElementById("button-finish-sealed").style.display = "inline-block";
    }
    else
        document.getElementById("button-finish-sealed").style.display = "none";
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
    document.getElementById("live-tab").innerHTML = (tab.style.display === "none") ? "Draft With Friends" : "Close";
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

    document.getElementById("packcount").innerHTML = packCount + " Packs Remaining";

    bindClickCardBackSealed();
    bindClickSealed();
}

function openPackSealed() {

    if ((packCount == 5 && cardReveals == 0) || (packCount >= 1 && cardReveals == 5)) {

        new Audio('./sound/pack-open2.wav').play();

        packCount--;

        if (packCount == 0) {
            document.getElementById("seasonpack").src = "./images/trans.png";
        }
        document.getElementById("packcount").innerHTML = packCount + " Packs Remaining";

        cardReveals = 0;
        [...document.getElementsByClassName("cardback")].forEach(
            (element, index, array) => {

                element.src = "./images/cardback-full.png";
                removeRarityClass(element);
            }
        );
        [...document.getElementsByClassName("sealed-update-card")].forEach(
            (element, index, array) => {
                element.style.display = "none"
            }
        );
        for (let x = 1; x <= 5; x++) {
            document.getElementById("sealed-desc-" + x).innerHTML = "";
        }
    }
}

function bindClickSealed() {
    [...document.getElementsByClassName("cardback")]
        .forEach(
            (element, index, array) => {
                element.addEventListener("click", function handler() {
                    if (this.src.includes("cardback-full.png")) {
                        let pick = drawCardSealed(0); // pick a card

                        this.src = DATA_URL + "images/cards/" + cards.card[pick].id + ".webp"; // render card.
                        this.setAttribute("cardid", cards.card[pick].id)
                        this.classList.add("pick-rarity-" + cards.card[pick].draftRarity);

                        let cardnumber = this.id.replace("draw", ""); // show don't have card button
                        document.getElementById("sealed-redraw-" + cardnumber).style.display = "inline-block"
                        document.getElementById("sealed-desc-" + cardnumber).innerHTML = cards.card[pick].desc;

                        new Audio('./sound/card-open.wav').play();
                        cardReveals++;

                        if (packCount == 0 && cardReveals == 5) { // all packs are opened
                            //renderOpenedCardsSealed();
                            document.getElementById("build-deck").style.display = "inline-block";
                        }
                    }
                })
            })
}

function drawCardSealed(cardid) { // if cardid is zero new role, else we're replacing a sealed draw

    if (cardid > 0) {
        // remove the card already in our hands
        cardsOpened.splice(cardsOpened.findIndex(x => parseInt(x.id) === parseInt(cardid)), 1);
    }

    let totalCards = cards.card.length;

    var pickRarity = randomNum(1, 100);
    var rarity = 1;
    if (pickRarity > 79 && pickRarity < 96)
        rarity = 2;
    else if (pickRarity >= 97)
        rarity = 3;

    let cardPicked = 0;
    do {
        let pickCard = randomNum(1, totalCards);
        // TODO: do we want duplicates and do we want rarity?
        //if (cards.card[pickCard].released == true && cards.card[pickCard].draftRarity == rarity && cardsOpened.findIndex(x => parseInt(x.id) === parseInt(cards.card[pickCard].id)) < 0) {
        if (cards.card[pickCard].released == true) {
            if (cardsOpened.findIndex(x => parseInt(x.id) === parseInt(cards.card[pickCard].id)) < 0) {
                cardsOpened.push(cards.card[pickCard]);
                cardPicked = pickCard;
            }
            else
                cardPicked = pickCard;
        }
    }
    while (cardPicked == 0);
    return cardPicked;
}

function sortOpenedSealed() {
    cardsOpened.sort((a, b) => a.name > b.name ? 1 : -1)
    cardsOpened.sort((a, b) => a.power - b.power);
    cardsOpened.sort((a, b) => a.energy - b.energy);
}

function renderOpenedCardsSealed() {

    document.getElementById("open-packs").style.display = "none";
    document.getElementById("draft").style.display = "";
    document.getElementById("draft-ui").style.display = "block";

    sortOpenedSealed();

    let table = document.getElementById("picks-sealed");

    for (var i = 0; i < table.rows.length;) {
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
            img.setAttribute("data-tippy-content", cardsOpened[x].desc);
            img.addEventListener("click", function handler() {

                if (cardsPicked.length < 12) {
                    cardsPicked.push(cards.card.find(x => parseInt(x.id) === parseInt(this.getAttribute("cardid"))));
                    cardsOpened.splice(cardsOpened.findIndex(x => parseInt(x.id) === parseInt(this.getAttribute("cardid"))), 1);

                    sortCards();
                    sortOpenedSealed();
                    drawPicks();
                    renderOpenedCardsSealed();
                }
            })

            td.appendChild(img);

            if (cells >= 8) {
                tr = table.insertRow(-1);
                cells = 0;
            }
            lastCard = cardsOpened[x].id;
        }
    }

    bindToolTips();
}

let tippyInstance;
function bindToolTips() {
    // this is a kinda inefficent, but I don't see an easier way to do this without rewriting a bunch of stuff and it's not THAT bad
    if (tippyInstance !== undefined) {
        //console.log(tippyInstance)
        tippyInstance.forEach(element => element.destroy())
    }

    tippyInstance = tippy('[data-tippy-content]', {
        theme: 'light-border',
        delay: [200, 200],
        maxWidth: 200,
        placement: 'bottom'
    });

}

function bindClickCardBackSealed() {

    for (var x = 0; x < 12; x++) {
        document.getElementById("card" + (x + 1)).addEventListener("click", function handler() {

            let card = cards.card.find(elm => parseInt(elm.id) === parseInt(this.getAttribute("cardid")));

            //console.log("elm", card);
            //console.log(cardsPicked.findIndex(x => parseInt(x.id) == parseInt(this.getAttribute("cardid"))))

            if (this.getAttribute("cardid") != null) { // handle clicking on a area that is not a card
                cardsOpened.push(card);
                cardsPicked.splice(cardsPicked.findIndex(x => parseInt(x.id) === parseInt(this.getAttribute("cardid"))), 1);

                //console.log(cardsPicked);
                sortCards();
                sortOpenedSealed();
                drawPicks();
                renderOpenedCardsSealed();
            }
        })
    }
}

function updateSealedCard(cardNum) {

    let element = document.getElementById("draw" + cardNum);
    let pick = drawCardSealed(parseInt(element.getAttribute("cardid")));

    element.src = DATA_URL + "images/cards/" + cards.card[pick].id + ".webp"; // render card
    element.setAttribute("cardid", cards.card[pick].id)
    document.getElementById("sealed-desc-" + cardNum).innerHTML = cards.card[pick].desc;
    removeRarityClass(element);
    element.classList.add("pick-rarity-" + cards.card[pick].draftRarity);
}

function removeRarityClass(element) {
    element.classList.forEach(item => {
        if (item.startsWith('pick-rarity')) {
            element.classList.remove(item);
        }
    });
}

function buildDeck() {
    renderOpenedCardsSealed();
}

function sealedComplete() {

    let draftList = "";

    for (let x = 1; x <= 12; x++) {
        let elm = document.getElementById("card" + x);
        draftList = draftList + "|" + cardsPicked[x - 1].id;
        // prevents clicks.. kinda hate this but couldn't find a way to remove anonymous events without a bunch of rework
        elm.addEventListener("click", function (event) {
            event.stopPropagation();
        }, true);
    }

    saveDraftToDb(draftList, 'sealed');
    document.getElementById("button-finish-sealed").style.display = "none";

    buildDeckCode();
    document.getElementById("picks").style.display = "none";
    //document.getElementById("draft-ui").style.display = "none";
    document.getElementById("picks-sealed").style.display = "none";
    document.getElementById("picks-complete").style.display = "block";
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
window.openPack = openPackSealed;
window.sealedComplete = sealedComplete;
window.updateSealedCard = updateSealedCard;
window.buildDeck = buildDeck;