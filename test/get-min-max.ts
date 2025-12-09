// node -r ts-node/register test/get-min-max.ts
let priceArray = [13.28,13.28,13.28,13.29,13.29,13.29,13.29,13.29,13.29,13.29,13.29,13.29,13.29,13.29,13.3,13.3,13.3,13.29,13.29,13.29]
  
function getMainTwoValues(prices: number[]) {
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

const res = getMainTwoValues(priceArray);
console.dir(res, { depth: null})