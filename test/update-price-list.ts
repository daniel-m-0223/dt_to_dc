import { getMxQuote } from '../src/mxApi';

// node -r ts-node/register test/update-price-list.ts

let priceArray: Number [] = [];
const PRC_LIMIT = 20;

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePriceList() {
    const quote = await getMxQuote("LINKUSDT");
    if (!quote) return;

    const price = Number(Number(quote.price).toFixed(2));

    priceArray.push(price);
    if (priceArray.length > PRC_LIMIT) {
        priceArray.shift();
        console.log(JSON.stringify(priceArray))
    }

    // Debug
    // console.log("Price List:", priceArray);
}

async function priceCollectorLoop() {
    while (true) {
        await updatePriceList();
        await sleep(500);     // collect quote every 0.5s
    }
}

// Start this in background
priceCollectorLoop();