import axios from "axios";

// node -r ts-node/register test/getTradablePairs.ts

async function getTradablePairs() {
  const res = await axios.get("https://api.mexc.com/api/v3/exchangeInfo");
  const symbols = res.data.symbols.map((s: any) => s.symbol);
//   console.log(symbols.slice(0, 20)); // show first 20 tradable symbols
  console.log(symbols);
}

getTradablePairs();
