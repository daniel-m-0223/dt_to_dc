import  { getMxQuote, mxSwap } from './mxApi';
import { minRange, maxRange, trAmount } from './config'

let totalBuyCnt: number = 0;
let totalSellCnt: number = 0;
let direction: string = "left";

(async () => {
    
    // const quote = await getMxQuote("SOLUSDT");
    setInterval(async () => {
        const now = new Date();
        const ctTime = now.toLocaleTimeString();
        console.log("---------------------------------------------------------------------------------------");
        const stQuote = await getMxQuote("SOLUSDT");
        const seQuote = await getMxQuote("SOLUSDE");
        if(stQuote) {
            console.log(`${stQuote.symbol} price: ${stQuote.price}`)
        } else {
            console.log("No quote found")

        }
        if(seQuote) {
            console.log(`${seQuote.symbol} price: ${seQuote.price}`)
        } else {
            console.log("No quote found")
        }

        if(stQuote && seQuote) {
            const diff = Math.abs(stQuote.price - seQuote.price);
            // const diffPercent = (diff / stQuote.price) * 100;
            console.log(`Diff: ${diff} || ${ctTime}`);
            // console.log(`Diff Percent: ${diffPercent}`)

            if(diff < minRange) {
                if(direction === "left") {
                    // E->S->T
                    // await mxSwap("SOLUSDE", "BUY", trAmount);
                    // await mxSwap("SOLUSDT", "SELL", trAmount);

                    totalBuyCnt++;
                }
                direction = "right";
                
            } else if(diff > maxRange) {
                if(direction === 'right') {
                    // T->S->E
                    // await mxSwap("SOLUSDT", "BUY", trAmount);
                    // await mxSwap("SOLUSDE", "SELL", trAmount);
                    totalSellCnt++;
                }
                direction = "left";
                
            }
            console.log(`Total Buy Cnt: ${totalBuyCnt} || Total Sell Cnt: ${totalSellCnt}`)
        }
    }, 5000);
})();