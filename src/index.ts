import { getMxQuote, mxSwap, checkOrderStatus } from './mxApi';
import { minRange, maxRange, trAmount } from './config';

const PRC_LIMIT = 20;
const ORDER_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const PRICE_DIFF_THRESHOLD = 0.4;
const PENDING_ORDER_LIMIT = 3;

let buyOrderId = '';
let sellOrderId = '';
let buyOrderReady = true;
let sellOrderReady = true;
let priceArray: number[] = [];
let tendency = '';
let orderTimestamp = 0;
let orderPrice = 0;
let pendingOrder: string[] = [];

let totalOrderNum = 0;

// --------------------Sleep Function--------------------------------------------//
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// --------------------Price Level Function--------------------------------------------//
function getPriceLevel() {
    if (priceArray.length < 20) return "unknown";

    const current = priceArray[priceArray.length - 1];
    const min = Math.min(...priceArray);
    const max = Math.max(...priceArray);
    const mid = (min + max) / 2;

    if (current <= min + (max - min) * 0.33) return "LOW";
    if (current >= min + (max - min) * 0.66) return "HIGH";
    return "MID";
}

// --------------------Pending Order Function--------------------------------------------//
function removePendingOrder(orderId: string) {
    const index = pendingOrder.indexOf(orderId);

    if (index !== -1) {
        pendingOrder.splice(index, 1);
    }
}
// --------------------Reset Function--------------------------------------------//
function resetState() {
    buyOrderId = '';
    sellOrderId = '';
    buyOrderReady = true;
    sellOrderReady = true;
    console.log("✅ State reset complete. Starting new cycle...");
}

// --------------------Check Restart Conditions--------------------------------------------//
function shouldRestartProcess() {
    const currentTime = Date.now();
    const currentQuote = priceArray[priceArray.length - 1];
    
    if (!currentQuote) {
        return false; // Can't check without current price
    }

    if(pendingOrder.length == 0) {
        return false;
    }
    
    const currentPrice = Number(Number(currentQuote).toFixed(2));
    let shouldRestart = false;
    
    const timeElapsed = currentTime - orderTimestamp;
    const priceDiff = Math.abs(currentPrice - orderPrice);
    console.log("condition detail",timeElapsed, ORDER_TIMEOUT_MS, priceDiff, PRICE_DIFF_THRESHOLD )
    if (timeElapsed >= ORDER_TIMEOUT_MS || priceDiff >= PRICE_DIFF_THRESHOLD) {
        shouldRestart = true;
    }
    
    return shouldRestart;
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

// ------------------------------MAIN FUNCTION LOOP---------------------------------------------------------

(async () => {
    while (true) {
        console.log("----------------------------------------------------");
        
        // Check if we need to restart the process
        console.log("initial condition is ", shouldRestartProcess(), pendingOrder.length, PENDING_ORDER_LIMIT)
        if (shouldRestartProcess() && pendingOrder.length < PENDING_ORDER_LIMIT) {
            resetState();// Brief pause before restarting
            // continue;
        }
        console.log("new order trigger");
        // const stQuote = await getMxQuote("SOLUSDT");
        let buyPrice = 0;
        let sellPrice = 0;
        // -------- Create both orders only if both are free --------
        // if (stQuote && buyOrderReady && sellOrderReady && priceArray.length == PRC_LIMIT) {
        if (buyOrderReady && sellOrderReady && priceArray.length == PRC_LIMIT) {

            const currentPrice = Number(Number(priceArray[priceArray.length - 1]).toFixed(2));
            if(getPriceLevel() === 'HIGH') {
                buyPrice  = currentPrice - 0.12;
                sellPrice = currentPrice;
            } else if (getPriceLevel() === 'LOW') {
                buyPrice  = currentPrice;
                sellPrice = currentPrice + 0.12;
            } else if (getPriceLevel() === 'MID') {
                buyPrice  = currentPrice - 0.06;
                sellPrice = currentPrice + 0.06;
            }
            
            // store order timestamp and price
            orderTimestamp = Date.now();
            orderPrice = (buyPrice + sellPrice) / 2;

            // correct ID assignment
            const buyData  = await mxSwap("SOLUSDT", "BUY",  '0.01', buyPrice.toString());
            buyOrderId  = buyData.orderId;
            pendingOrder.push(buyOrderId);

            const sellData = await mxSwap("SOLUSDT", "SELL", '0.01', sellPrice.toString());
            sellOrderId = sellData.orderId;
            pendingOrder.push(sellOrderId);

            buyOrderReady  = false;
            sellOrderReady = false;

            totalOrderNum++;
            console.log(`New cycle order number: ${totalOrderNum}`);
        }

        // -------- Check order statuses --------
        if (!buyOrderReady) {
            const buyOrderData = await checkOrderStatus('SOLUSDT', buyOrderId);
            if (buyOrderData.status === 'FILLED') {
                removePendingOrder(buyOrderId);
                // await sleep(1000);
                buyOrderReady = true;
                // if(sellOrderReady){ //Sell ordr already excecuted.
                //     tendency = 'up';
                // }
            }
            console.log(`Buy Status:  ${buyOrderData.status}`);
        }

        if (!sellOrderReady) {
            const sellOrderData = await checkOrderStatus('SOLUSDT', sellOrderId);
            if (sellOrderData.status === 'FILLED') {
                removePendingOrder(sellOrderId);
                // await sleep(1000);
                sellOrderReady = true;
                // if(buyOrderReady) { // Buy order already executed
                //     tendency = 'down';
                // }
            }
            console.log(`Sell Status: ${sellOrderData.status}`);
        }

        pendingOrder.forEach(async (orderId) => {
            const orderData = await checkOrderStatus('SOLUSDT', orderId);
            if (orderData.status === 'FILLED') {
                removePendingOrder(orderId);
            }
        });
        // loop delay
        await sleep(1000);
    }
})();
