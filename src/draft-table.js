import './app.css'
import './draft-table.css'

let cards;
let filter = [];
const DATA_URL = "https://snapdata.stonedonkey.com/";

async function getCards() {
    let result = await(await fetch("https://snapdata.stonedonkey.com/data/snap.json")).json();
    cards = result.data.cards;
    filter.card  = cards.card.filter(card => card.released == true && card.energy == 1);
    sortCards();
   
}


function bindCards() {

    filter.card.forEach(c => {
        
        let i = document.createElement("img");
        i.src = DATA_URL + "images/cards/" + c.id + ".webp"; // render card.
        i.classList.add("table-card")
        document.getElementById("wrapper").appendChild(i);

         if (c.released == true) 
             console.log(c.name);

    });
}

function sortCards() {
    filter.card.sort((a, b) => a.name > b.name ? 1 : -1)
    filter.card.sort((a, b) => a.power - b.power);
    filter.card.sort((a, b) => a.energy - b.energy);
}

window.getCards = getCards;
window.bindCards = bindCards;