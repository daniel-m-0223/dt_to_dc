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

export async function mxSwap(symbol: string, side: "BUY" | "SELL", quantity: string) {
  const timestamp = Date.now();
  const queryString = `symbol=${symbol}&side=${side}&type=MARKET&quantity=${quantity}&timestamp=${timestamp}`;

  // Sign the query string using HMAC-SHA256
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(queryString)
    .digest("hex");

  const url = `${BASE_URL}/api/v3/order?${queryString}&signature=${signature}`;

  try {
    const res = await axios.post(url, null, {
      headers: {
        "X-MEXC-APIKEY": API_KEY,
      },
    });
    console.log("✅ Swap successful:", res.data);
  } catch (err: any) {
    console.error("❌ Swap failed:", err.response?.data || err.message);
  }
}