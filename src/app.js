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

    let chose = 0;
    if (card === 1)
        chose = pick1;
    else if (card === 2)
        chose = pick2;
    else if (card === 3)
        chose = pick3;

    pickList += "|" + chose;

    cardsPicked.push(cards.card.find(x=> parseInt(x.id) === chose));
    cardsPicked.sort((a,b) => (a.name < b.name) ? 1 : -1);
    cardsPicked.sort((a,b) => a.energy > b.energy ? 1 : -1);

    drawPicks();

    currentPick++;
    updatePicks();

    if (currentPick > 12)
    {
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
    
    if (redraw === 1)
        do {
            pick1 = randomNum(1, 172);
        } while (pick1 === pick2 || pick1 === pick3 || pickList.indexOf("|" + pick1) > 0)
    else if (redraw === 2)
        do {
            pick2 = randomNum(1, 172);
        } while (pick1 === pick2 || pick2 === pick3 ||  pickList.indexOf("|" + pick2) > 0);
    else if (redraw === 3)
        do {
            pick3 = randomNum(1, 172);
        } while (pick1 === pick3 || pick2 === pick3 || pickList.indexOf("|" + pick3) > 0);


    document.getElementById("pick1").src = "./images/" + pick1 + ".webp";
    document.getElementById("pick2").src = "./images/" + pick2 + ".webp";
    document.getElementById("pick3").src = "./images/" + pick3 + ".webp";
}

function updatePicks() {

    do {
        pick1 = randomNum(1, 172);
    } while (pickList.indexOf("|" + pick1) > 0)

    do {
        pick2 = randomNum(1, 172);
    } while (pick1 === pick2 || pickList.indexOf("|" + pick2) > 0);

    do {
        pick3 = randomNum(1, 172);
    } while (pick1 === pick3 || pick2 === pick3 || pickList.indexOf("|" + pick3) > 0);

    document.getElementById("pick1").src = "./images/" + pick1 + ".webp";
    document.getElementById("pick2").src = "./images/" + pick2 + ".webp";
    document.getElementById("pick3").src = "./images/" + pick3 + ".webp";

}

function drawPicks() {
    for(var x = 0; x < cardsPicked.length ; x++) {
        document.getElementById("card" + (x+1)).src = "./images/" + cardsPicked[x].id + ".webp";
    }

    for(var y =0 ; y< 6; y++) {
        
        var count = cardsPicked.filter(elm => {
            return elm.energy == (y+1)}
        ).length;

        document.getElementById("energy" + (y+1)).style.height = count*10 + "px";
    }

}

window.updatePicks = updatePicks;
window.chooseCard = chooseCard;
window.redraw = redraw;