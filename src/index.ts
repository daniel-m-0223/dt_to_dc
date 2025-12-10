import { getMxQuote, mxSwap, checkOrderStatus, cancelOrder } from './mxApi';
import { minRange, maxRange, trAmount } from './config';
import { getBncQuote } from './bncApi';

const PRC_LIMIT = 20;
const ORDER_TIMEOUT_MS = 3 * 60 * 1000; // 5 minutes
const ORDER_TIME_DIFF = 10*1000;
const PRICE_DIFF_THRESHOLD = 0.5;
const CANCEL_PRICE_DIFF_THRESHOLD = 1;
const PENDING_ORDER_LIMIT = 4;
const TR_AMOUNT = '0.1';
const POOL_SYMBOL = 'SOLUSDT';

let buyOrderId = '';
let sellOrderId = '';
let buyOrderReady = true;
let sellOrderReady = true;
let priceArray: number[] = [];
let tendency = '';
let orderTimestamp = 0;
let orderPrice = 0;
let pendingOrder: string[] = [];
let totalCancelOrderNum = 0

let totalOrderNum = 0;
let expectPrice = 0;

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

// --------------------Get average price from price array--------------------------------------------//
function averagePrice(): any {
    if (priceArray.length < 20) return 0;

    const avgPrice = priceArray.reduce((a, b) => a + b, 0) / priceArray.length;
    // if(Math.abs(avgPrice - Number(priceArray[priceArray.length - 1])) > 0.0001)
    //     return 0
    // else
     return avgPrice;
}

// --------------------Pending Order Function--------------------------------------------//
function removePendingOrder(orderId: string) {
    const index = pendingOrder.indexOf(orderId);
    // console.log("Remove order", index, pendingOrder)
    if (index !== -1) {
        pendingOrder.splice(index, 1);
    }
    // console.log("After removing order", pendingOrder)
}
// --------------------Reset Function--------------------------------------------//
function resetState() {
    buyOrderId = '';
    sellOrderId = '';
    buyOrderReady = true;
    sellOrderReady = true;
    console.log("✅ Reset Order started");
}

// --------------------Check Restart Conditions--------------------------------------------//
function shouldRestartProcess() {
    const currentTime = Date.now();
    const currentQuote = priceArray[priceArray.length - 1];

    if (!currentQuote) {
        return false; // Can't check without current price
    }

    if (pendingOrder.length == 0) {
        return false;
    }

    const currentPrice = Number(Number(currentQuote).toFixed(5));
    let shouldRestart = false;

    const timeElapsed = currentTime - orderTimestamp;
    const priceDiff = Math.abs(currentPrice - orderPrice);
    // console.log("condition detail", timeElapsed, ORDER_TIMEOUT_MS, priceDiff, PRICE_DIFF_THRESHOLD)
    if (timeElapsed >= ORDER_TIMEOUT_MS || priceDiff >= PRICE_DIFF_THRESHOLD) {
        shouldRestart = true;
    }

    return shouldRestart;
}

// --------------------Check Cancel order from platform--------------------------------------------//
function handleCheckCancelOrder(pendingOrderData: any) {
    // const currentTime = Date.now();
    const currentQuote = priceArray[priceArray.length - 1];

    if (!currentQuote) {
        return false; // Can't check without current price
    }

    if (pendingOrder.length == 0) {
        return false;
    }

    let shouldCancel = false;
    const currentPrice = Number(Number(currentQuote).toFixed(5));
    const orderedPrice = Number(Number(pendingOrderData.price).toFixed(5));

    // const timeElapsed = currentTime - orderTimestamp;
    const priceDiff = Math.abs(currentPrice - orderedPrice);

    if (priceDiff >= CANCEL_PRICE_DIFF_THRESHOLD) {
        shouldCancel = true;
    }
    return shouldCancel

}

// --------------------Price Collector--------------------------------------------//

// async function updatePriceList() {
//     const quote = await getMxQuote(POOL_SYMBOL);
//     if (!quote) return;

//     const price = Number(Number(quote.price).toFixed(5));

//     priceArray.push(price);
//     if (priceArray.length > PRC_LIMIT) {
//         priceArray.shift();
//     }

//     // Debug
//     // console.log("Price List:", priceArray);
// }

// async function priceCollectorLoop() {
//     while (true) {
//         await updatePriceList();
//         await sleep(500);     // collect quote every 0.5s
//     }
// }

// // Start this in background
// priceCollectorLoop();

// ------------------------------MAIN FUNCTION LOOP---------------------------------------------------------

(async () => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/solusdt@ticker');

    ws.onmessage = msg => {
        const data = JSON.parse(msg.data);
        console.log("Last price:", data.c);
        expectPrice = data.c;
    };
    while (true) {
         console.log("--------------------------------------------------------------------------------------------------------");

        let buyPrice = 0;
        let sellPrice = 0;
        let isDiff = false;
        const mxQuote = await getMxQuote(POOL_SYMBOL);
        const bncQuote = await getBncQuote(POOL_SYMBOL);
        const diff = Number(Number(mxQuote?.price).toFixed(2)) - Number(Number(bncQuote?.price).toFixed(2));

        if (Math.abs(diff) > 0.1) isDiff = true; 


        if (buyOrderReady && sellOrderReady && isDiff) {
            
            
            if( diff > 0.1 ) {
                buyPrice = Number(Number(bncQuote?.price).toFixed(2)) + 0.01;
                sellPrice = Number(Number(mxQuote?.price).toFixed(2)) - 0.01;
            } else if ( diff < -0.1 ) {
                buyPrice = Number(Number(mxQuote?.price).toFixed(2)) + 0.01;
                sellPrice = Number(Number(bncQuote?.price).toFixed(2)) - 0.01;
            }

            // store order timestamp and price
            orderTimestamp = Date.now();
            orderPrice = (buyPrice + sellPrice) / 2;

            // correct ID assignment
            const buyData = await mxSwap(POOL_SYMBOL, "BUY", TR_AMOUNT, buyPrice.toString());
            if (buyData.orderId) {
                buyOrderId = buyData.orderId;
                pendingOrder.push(buyOrderId);
            }

            const sellData = await mxSwap(POOL_SYMBOL, "SELL", TR_AMOUNT, sellPrice.toString());
            if (sellData.orderId) {
                sellOrderId = sellData.orderId;
                pendingOrder.push(sellOrderId);
            }

            buyOrderReady = false;
            sellOrderReady = false;

            totalOrderNum++;
            console.log(`Start new order number: ${totalOrderNum}, ${pendingOrder}, \n
                  BuyPrice: ${buyPrice}, SellPrice: ${sellPrice} \n 
            `);
        }

        // -------- Check order statuses --------
        const currentTime = Date.now()
        let timeDiff = 0;
        let cancelRes: any;
        timeDiff = currentTime - orderTimestamp;

        if (!buyOrderReady) {
            const buyOrderData = await checkOrderStatus(POOL_SYMBOL, buyOrderId);
            if (buyOrderData.status === 'FILLED') {
                removePendingOrder(buyOrderId);

                buyOrderReady = true;
            } else {      
                let priceDiff = Math.abs(Number(Number(mxQuote?.price).toFixed(2)) -  Number(buyOrderData.price));
                if( timeDiff > ORDER_TIME_DIFF && priceDiff > 0.1 ) {
                    cancelRes = await cancelOrder(POOL_SYMBOL, buyOrderId)
                    removePendingOrder(buyOrderId);
                    totalCancelOrderNum++;
                    console.log("Cancel number is ", totalCancelOrderNum);
                    
                    const newBuyData = await mxSwap(POOL_SYMBOL, "BUY", TR_AMOUNT, (Number(mxQuote?.price)+0.01).toFixed(2));
                    buyOrderId = newBuyData.orderId;
                    pendingOrder.push(buyOrderId)
                }           
            }
        }

        if (!sellOrderReady) {
            const sellOrderData = await checkOrderStatus(POOL_SYMBOL, sellOrderId);
            if (sellOrderData.status === 'FILLED') {
                removePendingOrder(sellOrderId);
                sellOrderReady = true;
            } else {
                let priceDiff = Math.abs(Number(Number(mxQuote?.price).toFixed(2)) -  Number(sellOrderData.price));
                if( timeDiff > ORDER_TIME_DIFF && priceDiff > 0.1 ) {
                    cancelRes = await cancelOrder(POOL_SYMBOL, sellOrderId);
                    removePendingOrder(buyOrderId);
                    totalCancelOrderNum++;
                    console.log("Cancel number is ", totalCancelOrderNum); 
                    
                    const newSellData = await mxSwap(POOL_SYMBOL, "SELL", TR_AMOUNT, (Number(mxQuote?.price)+0.01).toFixed(2))
                    sellOrderId = newSellData.orderId;
                    pendingOrder.push(sellOrderId)
                } 
            }
        }

        await sleep(500);
    }
})();
