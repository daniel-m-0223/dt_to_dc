import  { getMxQuote, mxSwap, checkOrderStatus } from './mxApi';
import { minRange, maxRange, trAmount } from './config'

let totalBuyCnt: number = 0;
let totalSellCnt: number = 0;
let direction: string = "left";

let sellOrderId = '';
let buyOrderId = '';
let sellOrderReady = true;
let buyOrderReady = true;
let totalOrderNum = 0;

(async () => {
    
    // const quote = await getMxQuote("SOLUSDT");
    setInterval(async () => {
        const now = new Date();
        
        console.log("---------------------------------------------------------------------------------------");
        const stQuote = await getMxQuote("SOLUSDT");

        if( stQuote && sellOrderReady && buyOrderReady) {
            const currentPrice = Number(Number(stQuote.price).toFixed(2));
            const buyPrice = currentPrice - 0.03;
            const sellPrice = currentPrice + 0.03;
            
            const buyData = await mxSwap("SOLUSDT", "BUY", '0.01', buyPrice.toString());
            buyOrderId = buyData.orderId;
            const sellData = await mxSwap("SOLUSDT", "SELL", '0.01', sellPrice.toString());
            sellOrderId = sellData.orderId;

            sellOrderReady = false;
            buyOrderReady = false;

            totalOrderNum++;
            console.log(`Total orderNumber is ${totalOrderNum}`)
        }

        const sellOrderData = await checkOrderStatus('SOLUSDT', sellOrderId);
        const buyOrderData = await checkOrderStatus('SOLUSDT', buyOrderId)
                
        if(sellOrderData.status === 'FILLED')
            sellOrderReady = true;
        if(buyOrderData.status === 'FILLED')
            buyOrderReady = true;

        console.log(`Buy Status: ${buyOrderData.status}-------------Sell Order Statur: ${sellOrderData.status}`);


    }, 1000);
})();