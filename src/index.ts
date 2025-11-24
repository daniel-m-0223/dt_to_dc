import { getMxQuote, mxSwap, checkOrderStatus } from './mxApi';
import { minRange, maxRange, trAmount } from './config';

const PRC_LIMIT = 20;
let buyOrderId = '';
let sellOrderId = '';
let buyOrderReady = true;
let sellOrderReady = true;
let priceArray: number[] = [];
let tendency = '';

let totalOrderNum = 0;

// --------------------Sleep Function--------------------------------------------//
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --------------------Price Collector--------------------------------------------//

async function updatePriceList() {
    const quote = await getMxQuote("SOLUSDT");
    if (!quote) return;

    const price = Number(Number(quote.price).toFixed(4));

    priceArray.push(price);
    if (priceArray.length > PRC_LIMIT) {
        priceArray.shift();
    }

    // Debug
    console.log("Price List:", priceArray);
}

async function priceCollectorLoop() {
    while (true) {
        await updatePriceList();
        await sleep(500);     // collect quote every 0.5s
    }
}

// Start this in background
priceCollectorLoop();

// ------------------------------MAIN FUNCTION LOOP---------------------------------------------------------

(async () => {
    while (true) {
        console.log("----------------------------------------------------");
        
        const stQuote = await getMxQuote("SOLUSDT");
        let buyPrice = 0;
        let sellPrice = 0;
        // -------- Create both orders only if both are free --------
        if (stQuote && buyOrderReady && sellOrderReady) {

            const currentPrice = Number(Number(stQuote.price).toFixed(2));
            if(tendency === 'down') {
                buyPrice  = currentPrice - 0.05;
                sellPrice = currentPrice;
            } else if (tendency === 'up') {
                buyPrice  = currentPrice;
                sellPrice = currentPrice + 0.05;
            } else {
                buyPrice  = currentPrice - 0.025;
                sellPrice = currentPrice + 0.025;
            }
            
            // correct ID assignment
            const buyData  = await mxSwap("SOLUSDT", "BUY",  '0.01', buyPrice.toString());
            buyOrderId  = buyData.orderId;

            const sellData = await mxSwap("SOLUSDT", "SELL", '0.01', sellPrice.toString());
            sellOrderId = sellData.orderId;

            buyOrderReady  = false;
            sellOrderReady = false;

            totalOrderNum++;
            console.log(`New cycle order number: ${totalOrderNum}`);
        }

        // -------- Check order statuses --------
        if (!buyOrderReady) {
            const buyOrderData = await checkOrderStatus('SOLUSDT', buyOrderId);
            if (buyOrderData.status === 'FILLED') {
                // await sleep(1000);
                buyOrderReady = true;
                if(sellOrderReady){ //Sell ordr already excecuted.
                    tendency = 'up';
                }
            }
            console.log(`Buy Status:  ${buyOrderData.status}`);
        }

        if (!sellOrderReady) {
            const sellOrderData = await checkOrderStatus('SOLUSDT', sellOrderId);
            if (sellOrderData.status === 'FILLED') {
                // await sleep(1000);
                sellOrderReady = true;
                if(buyOrderReady) { // Buy order already executed
                    tendency = 'down';
                }
            }
            console.log(`Sell Status: ${sellOrderData.status}`);
        }
        console.log("price array list", priceArray)
        // loop delay
        await sleep(1000);
    }
})();
