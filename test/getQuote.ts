import { getMxQuote } from "../src/mxApi";
import  { getBncQuote } from "../src/bncApi";
import { before } from "node:test";

// node -r ts-node/register test/getQuote.ts

// getMxQuote("SOLUSDT");

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let totalNum: number = 0;
(async () => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/solusdt@ticker');

    ws.onmessage = msg => {
    const data = JSON.parse(msg.data);
    console.log("Last price:", data.c);
    };
    while (true) {
        console.log("----------------------------------------------------------------");
        const beforeTime = Date.now();
        const mxQuote = await getMxQuote("SOLUSDT");
        const afterMxTime = Date.now();
        const bncQuote = await getBncQuote("SOLUSDT")
        const afterBncTime = Date.now();
        const diff = Math.abs(Number(Number(mxQuote?.price).toFixed(2))- Number(Number(bncQuote?.price).toFixed(2))) 
        if(diff > 0.1) {
            totalNum++;
            console.log(`Total Number is ${totalNum}`)
        } 
        console.log(`Mx Quote: ${Number(Number(mxQuote?.price).toFixed(2))}`);
        console.log(`Bnc Quote: ${Number(Number(bncQuote?.price).toFixed(2))}`);
        console.log("Log time", beforeTime, afterMxTime, afterBncTime, afterMxTime-beforeTime, afterBncTime - afterMxTime)
        
        await sleep(1000);
    }
})();