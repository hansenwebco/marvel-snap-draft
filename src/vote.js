import { io } from "socket.io-client";
const queryString = require('query-string');
import { v4 as uuidv4 } from 'uuid';

let socket;
let voteSession;
let userSession;
let cards;

const SIGNALIO_SERVER = "wss://stone-donkey.onrender.com"
//const SIGNALIO_SERVER = "ws://localhost:3000";

async function loadCardsVote() {
    let result = await(await fetch("https://snapdata.stonedonkey.com/data/snap.json")).json();
    cards = result.data.cards;
}


function getUserSession() {
    
    let id;
    
    if (localStorage.getItem("snapvote") === null) {
        id = uuidv4();
        localStorage.setItem("snapvote",id);
    }
    else {
        id = localStorage.getItem("snapvote");
    }
    return id;
}

function startVoteSession() {
    const parsed = queryString.parse(location.search);

    voteSession = parsed.id;
    userSession = getUserSession();

    // TODO deal with this on prod vs dev
    socket = io(SIGNALIO_SERVER);

    let message = {};
    message.type = "connect";
    message.session = voteSession;
    message.user = userSession;

    socket.emit("message", message);

    socket.on("picksupdated", (arg) => {
        console.log("picks updated");
        drawUI(arg,true);
    })

    socket.on("stateupdate", (arg) => {
        console.log("state update");
        drawUI(arg,false)
    });

    socket.emit("getstate", voteSession);
}

function registerVote(vote) {
    var v = {};
    v.session = voteSession;
    v.userSession = getUserSession();
    v.pick = vote;

    for (let x = 1; x <= 3; x++) {
        document.getElementById("vote-button-" + x).classList.remove("btn-primary");
        document.getElementById("vote-button-" + x).classList.add("btn-secondary");
    }
    document.getElementById("vote-button-" + vote).classList.add("btn-primary");
    document.getElementById("vote-button-" + vote).classList.remove("btn-secondary");

    console.log(v);
    socket.emit("vote", v);
}

function drawUI(arg, resetVote) {

    drawPicks(arg);

    if (arg.instance.cardsPicked.length >= 12) {
        document.getElementById("picks").style.display = "none";
        document.getElementById("totalvotes").style.display = "none";
        document.getElementById("draft-done").style.display = "block";
        return;
    }

    if (resetVote)
        for (let x = 1; x <= 3; x++) {
            document.getElementById("vote-button-" + x).classList.remove("btn-primary");
            document.getElementById("vote-button-" + x).classList.add("btn-secondary");
        }

    let totalVotes = arg.votes.length;
   

    if (totalVotes && totalVotes > 0) {
        document.getElementById("client-vote-1").innerHTML = Math.round(((arg.votes.filter(elm => elm.pick === 1).length / totalVotes) * 100)) + "%";
        document.getElementById("client-vote-2").innerHTML = Math.round(((arg.votes.filter(elm => elm.pick === 2).length / totalVotes) * 100)) + "%";
        document.getElementById("client-vote-3").innerHTML = Math.round(((arg.votes.filter(elm => elm.pick === 3).length / totalVotes) * 100)) + "%";
    }
    else {
        document.getElementById("client-vote-1").innerHTML =  "0%";
        document.getElementById("client-vote-2").innerHTML =  "0%";
        document.getElementById("client-vote-3").innerHTML =  "0%";
    }

    let viewers = arg.viewers;
    document.getElementById("totalvotes").innerHTML = "Viewers " + viewers + " - Total Votes: " + (totalVotes === undefined ? 0 : totalVotes) 


    document.getElementById("client-pick1").src = "https://snapdata.stonedonkey.com/images/cards/" + arg.instance.pick1 + ".webp";
    document.getElementById("client-pick2").src = "https://snapdata.stonedonkey.com/images/cards/" + arg.instance.pick2 + ".webp";
    document.getElementById("client-pick3").src = "https://snapdata.stonedonkey.com/images/cards/" + arg.instance.pick3 + ".webp";

    document.getElementById("client-card-desc-1").innerHTML = cards.card[arg.instance.pick1 - 1].desc;
    document.getElementById("client-card-desc-2").innerHTML = cards.card[arg.instance.pick2 - 1].desc;
    document.getElementById("client-card-desc-3").innerHTML = cards.card[arg.instance.pick3 - 1].desc;



}

function drawPicks(arg) {
    let cardsPicked = arg.instance.cardsPicked;
    for (var x = 0; x < cardsPicked.length; x++) {
        document.getElementById("card" + (x + 1)).src = "https://snapdata.stonedonkey.com/images/cards/" + cardsPicked[x].id + ".webp";
    }
    for (var y = 0; y < 6; y++) {

        var count = cardsPicked.filter(elm => {
            return elm.energy == (y + 1)
        }
        ).length;

        document.getElementById("energy" + (y + 1)).style.height = 1 + count * 10 + "px";
    }
}


window.registerVote = registerVote;
window.startVoteSession = startVoteSession;
window.loadCardsVote = loadCardsVote;