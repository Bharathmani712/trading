// import "dotenv/config";
// // import Binance from "binance-api-node";
// import express from "express";
// import cors from "cors";
// import path from "path";
// import axios from "axios";

// // ===== MODES =====
// // 1 = API mode (Binance)
// // 0 = MANUAL mode (simulated up/down)
// let DATA_SOURCE_FLAG: 0 | 1 = 1;

// // ===== MANUAL PRICE STATE =====
// const MANUAL_BASE_PRICE = 93000; // starting value when switching to MANUAL
// const MANUAL_STEP = 2; // +2 or -2 each second

// type ManualDirection = "up" | "down" | "none";

// let manualPrice: number = MANUAL_BASE_PRICE;
// let manualDirection: ManualDirection = "none";

// // This is what we print each second and show in /btc-price
// let currentDisplayedPrice: string | null = null;

// // ====== BINANCE CLIENT ======
// // const client = Binance({
// //   apiKey: process.env.BINANCE_API_KEY ?? "",
// //   apiSecret: process.env.BINANCE_SECRET_KEY ?? "",
// // });

// // ====== COMMON: format to 2 decimals ======
// function formatToTwoDecimals(num: number | string): string {
//   const n = Number(num);
//   if (Number.isNaN(n)) {
//     return "NaN";
//   }
//   return n.toFixed(2); // normal rounding
// }

// // ====== API MODE: get price from Binance ======
// // async function getBtcPriceFromApi(): Promise<string | null> {
// //   try {
// //     const prices = await client.prices();
// //     const raw = prices.BTCUSDT;

// //     if (!raw) {
// //       console.log("BTCUSDT not found in API result");
// //       return null;
// //     }

// //     return formatToTwoDecimals(raw);
// //   } catch (err) {
// //     console.error("API error:", err);
// //     return null;
// //   }
// // }

// // ====== DELTA EXCHANGE: get BTCUSDT ticker ======
// async function getBtcPriceFromDelta(): Promise<string | null> {
//   try {
//     // Public ticker endpoint for a single symbol
//     const res = await axios.get(
//       "https://api.delta.exchange/v2/tickers/BTCUSDT"
//     );

//     // Delta returns an object in `result`
//     const result = res.data?.result;

//     if (!result) {
//       console.log("No result in Delta ticker response");
//       return null;
//     }

//     // You can choose last_price or mark_price
//     const rawPrice =
//       result.last_price ?? result.mark_price ?? result.close ?? null;

//     if (!rawPrice) {
//       console.log("No usable price field in Delta ticker");
//       return null;
//     }

//     return formatToTwoDecimals(rawPrice);
//   } catch (err) {
//     console.error("Delta API error:", err);
//     return null;
//   }
// }

// // ====== MANUAL MODE: step the price based on direction ======
// function stepManualPrice(): string {
//   if (manualDirection === "up") {
//     manualPrice += MANUAL_STEP;
//   } else if (manualDirection === "down") {
//     manualPrice -= MANUAL_STEP;
//   }
//   // if 'none', we just keep the same price

//   return formatToTwoDecimals(manualPrice);
// }

// function resetManualPrice() {
//   manualPrice = MANUAL_BASE_PRICE;
//   manualDirection = "none";
// }

// // ====== MAIN LOOP (runs every second) ======
// async function startPriceLoop() {
//   console.log(
//     `Starting price loop. Initial mode: ${
//       DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL"
//     }`
//   );

//   setInterval(async () => {
//     let price: string | null = null;

//     if (DATA_SOURCE_FLAG === 1) {
//       // API mode
//       price = await getBtcPriceFromDelta();
//       if (price) {
//         console.log(`[API] BTCUSDT: ${price}`);
//       }
//     } else {
//       // MANUAL mode
//       price = stepManualPrice();
//       console.log(
//         `[MANUAL ${manualDirection.toUpperCase()}] BTCUSDT: ${price}`
//       );
//     }

//     if (!price) {
//       console.log("Failed to get BTCUSDT price");
//     }

//     currentDisplayedPrice = price;
//   }, 1000);
// }

// // ================== EXPRESS SERVER / UI API ==================
// const app = express();
// const PORT = 3000;

// app.use(cors());
// app.use(express.json());

// // Serve static UI
// app.use(express.static(path.join(__dirname, "public")));

// // Get current mode + price
// app.get("/mode", (req, res) => {
//   res.json({
//     flag: DATA_SOURCE_FLAG,
//     mode: DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL",
//     manualDirection,
//   });
// });

// // Toggle API / MANUAL
// app.post("/mode", (req, res) => {
//   const { flag } = req.body as { flag?: number };

//   if (flag !== 0 && flag !== 1) {
//     return res.status(400).json({ error: "flag must be 0 or 1" });
//   }

//   if (flag === 0 && DATA_SOURCE_FLAG !== 0) {
//     // switching into MANUAL – reset to base price
//     resetManualPrice();
//   }

//   DATA_SOURCE_FLAG = flag as 0 | 1;
//   console.log("Mode changed to:", DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL");

//   res.json({
//     flag: DATA_SOURCE_FLAG,
//     mode: DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL",
//     manualDirection,
//   });
// });

// // Set manual direction: 'up' or 'down'
// app.post("/manual-direction", (req, res) => {
//   const { direction } = req.body as { direction?: ManualDirection };

//   if (direction !== "up" && direction !== "down") {
//     return res.status(400).json({ error: "direction must be 'up' or 'down'" });
//   }

//   manualDirection = direction;

//   console.log("Manual direction set to:", manualDirection);
//   res.json({ manualDirection });
// });

// // Get current displayed price (whatever the loop last set)
// app.get("/btc-price", (req, res) => {
//   res.json({
//     flag: DATA_SOURCE_FLAG,
//     mode: DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL",
//     manualDirection,
//     price: currentDisplayedPrice,
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server + UI running on http://localhost:${PORT}`);
//   startPriceLoop();
// });

import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

// 👇 Delta Node client (CommonJS export, no TS types)
const DeltaRestClient = require("delta-rest-client") as any;

// ===== MODES =====
// 1 = API mode (Delta)
// 0 = MANUAL mode (simulated up/down)
let DATA_SOURCE_FLAG: 0 | 1 = 1;

// ===== MANUAL PRICE STATE =====
const MANUAL_BASE_PRICE = 93000; // starting value when switching to MANUAL
const MANUAL_STEP = 2; // +2 or -2 each second

type ManualDirection = "up" | "down" | "none";

let manualPrice: number = MANUAL_BASE_PRICE;
let manualDirection: ManualDirection = "none";

// This is what we print each second and show in /btc-price
let currentDisplayedPrice: string | null = null;

// ====== DELTA CLIENT (singleton) ======
const DELTA_API_KEY = process.env.DELTA_API_KEY ?? "";
const DELTA_API_SECRET = process.env.DELTA_API_SECRET ?? "";

// constructor returns a Promise that resolves to the client
const deltaClientPromise: Promise<any> = new DeltaRestClient(
  DELTA_API_KEY,
  DELTA_API_SECRET
);

// ====== COMMON: format to 2 decimals ======
function formatToTwoDecimals(num: number | string): string {
  const n = Number(num);
  if (Number.isNaN(n)) {
    return "NaN";
  }
  return n.toFixed(2); // normal rounding
}

// ====== API MODE: get price from Delta (ticker) ======
// ====== DELTA EXCHANGE (NODE CLIENT): get BTCUSDT 24hr ticker ======
async function getBtcPriceFromDelta(): Promise<string | null> {
  try {
    const client = await deltaClientPromise;

    // This maps to /products/ticker/24hr?symbol=BTCUSDT
    // operationId in swagger: "get24hrTicker" → node client: get24hrTicker
    const response = await client.apis.Products.get24hrTicker({
      symbol: "BTCUSDT", // make sure this matches the exact symbol you want
    });

    // delta-rest-client returns Buffer in response.data
    const body = JSON.parse(response.data.toString());

    // If you want to inspect once:
    // console.log("Delta 24hrTicker raw:", body);

    // 24hrTicker schema is directly the ticker object, no "result" wrapper.
    // Pick the field you want to show:
    const rawPrice = body.mark_price ?? body.last_price ?? body.close ?? null;

    if (!rawPrice) {
      console.log("No usable price field in Delta 24hrTicker");
      return null;
    }

    return formatToTwoDecimals(rawPrice);
  } catch (err) {
    console.error("Delta node client error:", err);
    return null;
  }
}

// ====== MANUAL MODE: step the price based on direction ======
function stepManualPrice(): string {
  if (manualDirection === "up") {
    manualPrice += MANUAL_STEP;
  } else if (manualDirection === "down") {
    manualPrice -= MANUAL_STEP;
  }
  // if 'none', we just keep the same price

  return formatToTwoDecimals(manualPrice);
}

function resetManualPrice() {
  manualPrice = MANUAL_BASE_PRICE;
  manualDirection = "none";
}

// ====== MAIN LOOP (runs every second) ======
async function startPriceLoop() {
  console.log(
    `Starting price loop. Initial mode: ${
      DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL"
    }`
  );

  setInterval(async () => {
    let price: string | null = null;

    if (DATA_SOURCE_FLAG === 1) {
      // API mode (Delta)
      price = await getBtcPriceFromDelta();
      if (price) {
        console.log(`[API/DELTA] BTCUSDT: ${price}`);
      }
    } else {
      // MANUAL mode
      price = stepManualPrice();
      console.log(
        `[MANUAL ${manualDirection.toUpperCase()}] BTCUSDT: ${price}`
      );
    }

    if (!price) {
      console.log("Failed to get BTCUSDT price");
    }

    currentDisplayedPrice = price;
  }, 1000);
}

// ================== EXPRESS SERVER / UI API ==================
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Serve static UI
app.use(express.static(path.join(__dirname, "public")));

// Get current mode + price
app.get("/mode", (req, res) => {
  res.json({
    flag: DATA_SOURCE_FLAG,
    mode: DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL",
    manualDirection,
  });
});

// Toggle API / MANUAL
app.post("/mode", (req, res) => {
  const { flag } = req.body as { flag?: number };

  if (flag !== 0 && flag !== 1) {
    return res.status(400).json({ error: "flag must be 0 or 1" });
  }

  if (flag === 0 && DATA_SOURCE_FLAG !== 0) {
    // switching into MANUAL – reset to base price
    resetManualPrice();
  }

  DATA_SOURCE_FLAG = flag as 0 | 1;
  console.log("Mode changed to:", DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL");

  res.json({
    flag: DATA_SOURCE_FLAG,
    mode: DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL",
    manualDirection,
  });
});

// Set manual direction: 'up' or 'down'
app.post("/manual-direction", (req, res) => {
  const { direction } = req.body as { direction?: ManualDirection };

  if (direction !== "up" && direction !== "down") {
    return res.status(400).json({ error: "direction must be 'up' or 'down'" });
  }

  manualDirection = direction;

  console.log("Manual direction set to:", manualDirection);
  res.json({ manualDirection });
});

// Get current displayed price (whatever the loop last set)
app.get("/btc-price", (req, res) => {
  res.json({
    flag: DATA_SOURCE_FLAG,
    mode: DATA_SOURCE_FLAG === 1 ? "API" : "MANUAL",
    manualDirection,
    price: currentDisplayedPrice,
  });
});

app.listen(PORT, () => {
  console.log(`Server + UI running on http://localhost:${PORT}`);
  startPriceLoop();
});
