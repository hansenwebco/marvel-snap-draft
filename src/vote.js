import { io } from "socket.io-client";
const queryString = require('query-string');
import { v4 as uuidv4 } from 'uuid';

let socket;
let voteSession;
let userSession;

function startVoteSession() {
    const parsed = queryString.parse(location.search);

    voteSession = parsed.id;
    userSession = uuidv4();

    socket = io("ws://localhost:4000");

    let message = {};
    message.type = "connect";
    message.session = voteSession;

    socket.emit("message", message);

    socket.on("picksupdated", (arg) => {
        drawUI(arg,true);
    })

    socket.on("stateupdate", (arg) => {
        drawUI(arg,false)
    });

    socket.emit("getstate", voteSession);
}

function registerVote(vote) {
    var v = {};
    v.session = voteSession;
    v.userSession = userSession;
    v.pick = vote;

    for (let x = 1; x <= 3; x++) {
        document.getElementById("vote-button-" + x).classList.remove("btn-primary");
        document.getElementById("vote-button-" + x).classList.add("btn-secondary");
    }

    //console.log( document.getElementById("vote-button-" + vote).classList);
    document.getElementById("vote-button-" + vote).classList.add("btn-primary");
    document.getElementById("vote-button-" + vote).classList.remove("btn-secondary");

    socket.emit("vote", v);
}

function drawUI(arg, resetVote) {

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

    document.getElementById("totalvotes").innerHTML = "Total Votes: " + (totalVotes === undefined ? 0 : totalVotes);


    document.getElementById("client-pick1").src = "./images/" + arg.instance.pick1 + ".webp";
    document.getElementById("client-pick2").src = "./images/" + arg.instance.pick2 + ".webp";
    document.getElementById("client-pick3").src = "./images/" + arg.instance.pick3 + ".webp";

    document.getElementById("client-card-desc-1").innerHTML = cards.card[arg.instance.pick1 - 1].desc;
    document.getElementById("client-card-desc-2").innerHTML = cards.card[arg.instance.pick2 - 1].desc;
    document.getElementById("client-card-desc-3").innerHTML = cards.card[arg.instance.pick3 - 1].desc;
}

window.registerVote = registerVote;
window.startVoteSession = startVoteSession;