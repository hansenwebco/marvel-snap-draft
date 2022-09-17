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
        console.log("picksupdated")
        document.getElementById("client-pick1").src =  "./images/" + arg.instance.pick1 + ".webp";
        document.getElementById("client-pick2").src =  "./images/" + arg.instance.pick2 + ".webp";
        document.getElementById("client-pick3").src =  "./images/" + arg.instance.pick3 + ".webp";

        document.getElementById("client-card-desc-1").innerHTML = cards.card[arg.instance.pick1 - 1].desc;
        document.getElementById("client-card-desc-2").innerHTML = cards.card[arg.instance.pick2 - 1].desc;
        document.getElementById("client-card-desc-3").innerHTML = cards.card[arg.instance.pick3 - 1].desc;

    })
    
    socket.on("stateupdate", (arg) => {
        document.getElementById("client-pick1").src =  "./images/" + arg.instance.pick1 + ".webp";
        document.getElementById("client-pick2").src =  "./images/" + arg.instance.pick2 + ".webp";
        document.getElementById("client-pick3").src =  "./images/" + arg.instance.pick3 + ".webp";
       
        document.getElementById("client-card-desc-1").innerHTML = cards.card[arg.instance.pick1 - 1].desc;
        document.getElementById("client-card-desc-2").innerHTML = cards.card[arg.instance.pick2 - 1].desc;
        document.getElementById("client-card-desc-3").innerHTML = cards.card[arg.instance.pick3 - 1].desc;

        console.log("stateupdate");
        console.log(arg);
    });

    socket.emit("getstate",voteSession);
}

function registerVote(vote) {
    var v = {};
    v.session = voteSession;
    v.userSession = userSession;
    v.pick = vote;

    socket.emit("vote", v);
}

window.registerVote = registerVote;
window.startVoteSession = startVoteSession;