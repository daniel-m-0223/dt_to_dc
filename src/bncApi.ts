import axios from "axios";
import crypto from "crypto";
import { API_KEY, API_SECRET, BASE_URL} from "./config";

interface BncQuote {
    symbol: string;
    price: number;
}

export async function getBncQuote(symbol: string): Promise<BncQuote | null> {
    try {
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}`;
        // console.log(`Fetching quote for ${url}`);
        const response = await axios.get<BncQuote>(url);
        // console.log(`Response: ${JSON.stringify(response.data)}`);
        return response.data;
      } catch (error: any) {
        console.error(`❌ Error fetching quote for ${symbol}:`, error.message);
        return null;
      }
}