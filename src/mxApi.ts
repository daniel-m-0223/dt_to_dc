import axios from "axios";
import crypto from "crypto";
import { API_KEY, API_SECRET, BASE_URL} from "./config";
interface MxQuote {
    symbol: string;
    price: number;
}

export async function getMxQuote(symbol: string): Promise<MxQuote | null> {
    try {
        const url = `https://api.mexc.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`;
        // console.log(`Fetching quote for ${url}`);
        const response = await axios.get<MxQuote>(url);
        // console.log(`Response: ${JSON.stringify(response.data)}`);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Error fetching quote for ${symbol}:`, error.message);
        return null;
      }
}

// export async function mxSwap(symbol: string, side: "BUY" | "SELL", quantity: string) {
//   const timestamp = Date.now();
//   const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;

//   // Sign the query string using HMAC-SHA256
//   const signature = crypto
//     .createHmac("sha256", API_SECRET)
//     .update(queryString)
//     .digest("hex");

//   const url = `${BASE_URL}/api/v3/order?${queryString}&signature=${signature}`;

//   try {
//     const res = await axios.post(url, null, {
//       headers: {
//         "X-MEXC-APIKEY": API_KEY,
//       },
//     });
//     console.log("✅ Swap successful:", res.data);
//   } catch (err: any) {
//     console.error("❌ Swap failed:", err.response?.data || err.message);
//   }
// }
async function getServerTime() {
  try {
    const res = await fetch("https://api.mexc.com/api/v3/time");
    const data: any = await res.json();
    return data.serverTime; 
  } catch(err: any) {
    console.error(err);
  }
  
}

export async function mxSwap(symbol: string, side: "BUY" | "SELL", quantity: string, price: string): Promise<any> {
  const serverTime = await getServerTime();
  const recvWindow = 50000;
  const queryString = `symbol=${symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}&recvWindow=${recvWindow}&timestamp=${serverTime}`;


  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(queryString)
    .digest("hex");

  const url = `https://api.mexc.com/api/v3/order?${queryString}&signature=${signature}`;
  // console.log("post url is", url)
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-MEXC-APIKEY": API_KEY,
      // ❌ Do NOT include "Content-Type": "application/json"
      // ✅ MEXC wants URL-encoded query only
    },
  });  

  const data = await res.json();
  console.log("swap res data", url,data);
  return data;
}

export async function checkOrderStatus(symbol: string, orderId: string): Promise<any> {
  // const serverTime = await getServerTime();
  const serverTime = Date.now();
  const query = `symbol=${symbol}&orderId=${orderId}&timestamp=${serverTime}`;

  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(query)
    .digest("hex");

  const url = `https://api.mexc.com/api/v3/order?${query}&signature=${signature}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-MEXC-APIKEY": API_KEY,
      },
    });

    const data = await res.json();
    // console.log(data);
    return data;
  } catch(err) {
    console.error(err)
  }
  
}

export async function cancelOrder(symbol: string, orderId: string) {
  const serverTime = await getServerTime();
  const query = `symbol=${symbol}&orderId=${orderId}&timestamp=${serverTime}`;

  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(query)
    .digest("hex");

  const url = `https://api.mexc.com/api/v3/order?${query}&signature=${signature}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      "X-MEXC-APIKEY": API_KEY,
    }
  });

  return await res.json();
}
