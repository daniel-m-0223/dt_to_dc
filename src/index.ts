import { getMxQuote, mxSwap, checkOrderStatus } from './mxApi';
import { minRange, maxRange, trAmount } from './config';

const PRC_LIMIT = 20;
const ORDER_TIMEOUT_MS = 3 * 60 * 1000; // 5 minutes
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
    const quote = await getMxQuote("LINKUSDT");
    if (!quote) return;

    const price = Number(Number(quote.price).toFixed(2));

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

// ------------------------------GET MAIN TWO VALUES---------------------------------------------------------
function getMainTwoValues(prices: number[]): {min: number, max: number} | any {
    if (!Array.isArray(prices) || prices.length === 0) return "fail";

    const lastValue: number = prices[prices.length - 1];

    // Count frequencies
    const freq: Record<number, number> = {};
    for (const p of prices) {
        freq[p] = (freq[p] || 0) + 1;
    }

    // Sort by frequency (desc)
    const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])  // sort by count
        .map(item => Number(item[0])); // extract price values

    const mainTwo = sorted.slice(0, 2);

    // Last value must be one of the top 2
    if (!mainTwo.includes(lastValue)) {
        return "fail";
    }

    const diff = Math.abs(mainTwo[0] - mainTwo[1])
    
    let result = {}
    console.log(`mainTwo value-- ${mainTwo}`)
    if(diff > 0.01) {
        // if last value is max value or not
        if(mainTwo[0] == prices[prices.length - 1]) {
            result = {
                min: mainTwo[0] - 0.01,
                max: mainTwo[0]
            }
        } else {
            result = {
                min: mainTwo[1],
                max: mainTwo[1] + 0.01
            }
        }
    } else {
        result = {
            min: mainTwo[1],
            max: mainTwo[0]
        }
    }

    return result;
}

// ------------------------------MAIN FUNCTION LOOP---------------------------------------------------------

(async () => {
    while (true) {
        console.log("----------------------------------------------------");
        
        // Check if we need to restart the process
        // if (shouldRestartProcess() && pendingOrder.length < PENDING_ORDER_LIMIT) {
        //     resetState();// Brief pause before restarting
        //     // continue;
        // }

        console.log("new order trigger", buyOrderReady, sellOrderReady);
        let buyPrice = 0;
        let sellPrice = 0;
        // -------- Create both orders only if both are free --------
        if (buyOrderReady && sellOrderReady && priceArray.length == PRC_LIMIT) {
            const currentPrice = Number(Number(priceArray[priceArray.length - 1]).toFixed(2));
            
            if(getMainTwoValues(priceArray) == 'fail'){
                console.log("it's faile value");
                continue;
            } else {
                buyPrice = getMainTwoValues(priceArray).min;
                sellPrice = getMainTwoValues(priceArray).max;
            }
            console.log("it should not never showed when fail")

            // store order timestamp and price
            orderTimestamp = Date.now();
            orderPrice = (buyPrice + sellPrice) / 2;

            // correct ID assignment
            const buyData  = await mxSwap("LINKUSDT", "BUY",  '0.1', buyPrice.toString());
            console.log("buyData --", buyData)
            if(buyData.orderId) {
                buyOrderId  = buyData.orderId;
                pendingOrder.push(buyOrderId);
            }

            const sellData = await mxSwap("LINKUSDT", "SELL", '0.1', sellPrice.toString());
            console.log("sell Data", sellData)
            if( sellData.orderId) {
                sellOrderId = sellData.orderId;
                pendingOrder.push(sellOrderId);
            }
            
            buyOrderReady  = false;
            sellOrderReady = false;

            totalOrderNum++;
            console.log(`New order triggered: ${totalOrderNum}, ${buyOrderId}, ${sellOrderId}`);
        }

        // -------- Check order statuses --------
        if (!buyOrderReady) {
            const buyOrderData = await checkOrderStatus('LINKUSDT', buyOrderId);
            if (buyOrderData.status === 'FILLED') {
                removePendingOrder(buyOrderId);
                buyOrderReady = true;
            }
            console.log(`Buy Status:  ${buyOrderData.status}`);
        }

        if (!sellOrderReady) {
            const sellOrderData = await checkOrderStatus('LINKUSDT', sellOrderId);
            if (sellOrderData.status === 'FILLED') {
                removePendingOrder(sellOrderId);
                sellOrderReady = true;
            }
            console.log(`Sell Status: ${sellOrderData.status}`);
        }

        pendingOrder.forEach(async (orderId) => {
            const orderData = await checkOrderStatus('LINKUSDT', orderId);
            if (orderData.status === 'FILLED') {
                removePendingOrder(orderId);
            }
        });
        // loop delay
        await sleep(1000);
    }
})();
