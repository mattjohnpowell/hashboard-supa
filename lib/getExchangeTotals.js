var ccxt = require("ccxt");
import parseFromString from "@/lib/xmlhelper";
let rateArrayGlobal = [];
let allExchageData = [];
let positions = [];

export default async function getExchangeTotals(
  exchangeName = "",
  apikey,
  secretkey,
  passphrase,
  subaccount,
  nickname,
  uid,
  proxy
) {
  // connect to exchange via ccxt
  allExchageData = [];
  positions = [];
  let rateArray = [];
  let ftxFXExchange = new ccxt.ftx({});
  const FX = ["EUR", "GBP", "CAD"];
  for (let i = 0; i < FX.length; i++) {
    let fx = FX[i];
    let rate = await ftxFXExchange.fetchTicker(fx + "/USD");
    rateArray.push({
      currency: fx,
      rate: rate.last,
    });
  }

  let xchangeName = "";
  xchangeName = exchangeName.toLowerCase();
  //console.log("xchangeName: ", xchangeName);
  let exchange = null;
  if (ccxt.exchanges.includes(xchangeName)) {
    //console.log("exchange found");
    const exchangeId = xchangeName;
    const exchangeClass = ccxt[exchangeId];
    if (subaccount == null || subaccount == "") {
      if (exchangeId == "binance") {
        exchange = new exchangeClass({
          proxy: proxy,
          apiKey: apikey,
          secret: secretkey,
          password: passphrase,
        });
      } else {
        exchange = new exchangeClass({
          apiKey: apikey,
          secret: secretkey,
          password: passphrase,
        });
      }
    } else if (
      (subaccount != null || subaccount != "") &&
      exchangeId == "ftx"
    ) {
      exchange = new exchangeClass({
        apiKey: apikey,
        secret: secretkey,
        password: passphrase,
        uid: uid,
        headers: {
          "FTX-SUBACCOUNT": subaccount,
        },
      });
    }
  }

  if (exchange && exchange.has.fetchPositions) {
    try {
      const fp = await exchange.fetchPositions();
      for (let i = 0; i < fp.length; i++) {
        let fpItem = fp[i];

        if (parseFloat(fpItem.info.size) > 0) {
          positions.push(fpItem);
          console.log("fp: " + xchangeName, fp);
        }
      }
    } catch (e) {
      console.log("error: " + xchangeName, e);
    }
  }
  console.log("positions: ", positions);

  if (exchange) {
    // get exchange balance data
    try {
      let exchangeBalance = null;
      let allAssets = {};
      //console.log("exchangeName: ", exchangeName);
      if (exchangeName == "Coinbase") {
        const exchangeAccounts = await exchange.fetchAccounts();
        //console.log("XexchangeBalance: ", exchangeBalance);
        for (let i = 0; i < exchangeAccounts.length; i++) {
          if (parseFloat(exchangeAccounts[i].info.balance.amount) > 0) {
            allAssets[exchangeAccounts[i].info.balance.currency] = parseFloat(
              exchangeAccounts[i].info.balance.amount
            );

            //until CB fix their fucking API

            //assets.set("GBP", 22454.0);
          }
        }
      } else {
        exchangeBalance = await exchange.fetchBalance();
        allAssets = exchangeBalance.total;
      }

      //console.log("allAssetsCB: "+exchangeName, allAssets);
      // get exchange rate data

      //get all assets that are great than zero balance and convert to USD then add asset and price to an array
      allExchageData = [];
      for (const [key, value] of Object.entries(allAssets)) {
        if (value > 0) {
          let asset = key;
          let qty = value;
          let usdrate = 0; // set default rate to 0
          let usdtokenrate = 0; //usd rate of token
          let usdtoken = asset + "/USD"; //setting /USD just in case
          if (asset.match(/USD|EUR|GBP|USDT|BUSD|USDC/)) {
            if (asset.match(/USD|USDT|BUSD|USDC/)) {
              usdrate = 1;
            } else {
              //convert EUR to USD using api

              usdrate = rateArray.find((x) => x.currency == asset).rate;
            }
          } else {
            //get usd token rate from exchange via keypair

            if (xchangeName === "binance") {
              usdtoken = `${asset}/BUSD`;
            } else {
              usdtoken = `${asset}/USD`;
            }

            try {
              usdrate = await exchange.fetchTicker(usdtoken);
              usdrate = usdrate.last;
            } catch (e) {
              usdrate = 0;
              //console.log("error: ", e);
            }
          }
          let total = qty * usdrate;
          if (total > 1) {
            //only add valuable tokens
            //if (asset == "SOL") console.log("ur: ", exchangeName, asset, qty, usdrate);
            let renamed_asset = asset;
            if (asset == "USDT" || asset == "BUSD" || asset == "USDC")
              renamed_asset = "USD";
            allExchageData.push({
              exchange: exchangeName,
              nickname: nickname,
              subaccount: subaccount,
              asset: asset,
              renamed_asset: renamed_asset,
              usdrate: usdrate,
              qty: qty,
              total: total,
            });
          }
        }
      }
    } catch (error) {
      console.log("Exchange Error", error);
      return [];
    }
  }

  return [allExchageData,  positions];
}
