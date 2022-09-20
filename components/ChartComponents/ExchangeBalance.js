import ccxt from "ccxt";
import { useEffect, useState } from "react";
import CoinGecko from "coingecko-api";
import parseFromString from "@/lib/xmlhelper";

export default function ExchangeBalance({
  exchangeName,
  apikey,
  secretkey,
  passphrase,
  nickname,
  subaccount,
  uid,

  handleClick,
}) {
  const [data, setData] = useState([]);
  const [exchangeBalanceState, setExchangeBalance] = useState(0);
  const [allAssets, setAllAssets] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [rateArrayGlobal, setRateArray] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [test, setTest] = useState(1);

  let xchangeName = exchangeName.toLowerCase();

  useEffect(() => {
    let isMounted = true;
    const RSS_URL = `https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml`;

    fetch(RSS_URL)
      .then((res) => res.text())
      .then((data) => {
        var xml = parseFromString(data);
        var rates = xml.children[2].children[0].children;
        var rateArray = [];
        for (var i = 0; i < rates.length; i++) {
          rateArray.push({
            currency: rates[i].attributes.currency,
            rate: rates[i].attributes.rate,
          });
        }
        setRateArray(rateArray);
      })
      .catch((err) => console.log(err));

    const fetchData = async () => {
      let usd_key = "";
      try {
        const proxy = "https://c123anywhere.herokuapp.com/";
        const exchange = null;

        if (subaccount == null || subaccount == "") {
          const exchangeId = xchangeName;
          const exchangeClass = ccxt[exchangeId];
          exchange = new exchangeClass({
            proxy: proxy,
            apiKey: apikey,
            secret: secretkey,
            password: passphrase,
          });
        } else {
          const exchangeId = xchangeName;
          const exchangeClass = ccxt[exchangeId];
          exchange = new exchangeClass({
            proxy: proxy,
            apiKey: apikey,
            secret: secretkey,
            password: passphrase,
            headers: {
              "FTX-SUBACCOUNT": subaccount,
            },
          });
        }

        //exchange.verbose = true
        const assets = new Map();
        if (xchangeName == "coinbase") {
          let exchangeAccounts = await exchange.fetchAccounts();

          for (let i = 0; i < exchangeAccounts.length; i++) {
            if (parseFloat(exchangeAccounts[i].info.balance.amount) > 0) {
              assets[exchangeAccounts[i].info.balance.currency] = parseFloat(
                exchangeAccounts[i].info.balance.amount
              );

              //until CB fix their fucking API

              //assets.set("GBP", 22454.0);
            }
          }
        } else {
          let exchangeBalance = await exchange.fetchBalance();

          for (const [key, value] of Object.entries(exchangeBalance)) {
            if (value.total > 0) {
              assets.set(key, value.total);
            }
          }
        }
        //console.log("assets-" + xchangeName, assets);
        //setAllAssets(assets);

        let total = 0;

        //loop assets and fetchOHLCV on each key pair

        const t = forLoop(assets, xchangeName, exchange, isMounted);
      } catch (error) {
        console.log("error-" + xchangeName, usd_key, error);
        setError(error);
      }

      setLoading(false);
    };
    fetchData();
    return () => {
      // 👇️ when component unmounts, set isMounted to false
      isMounted = false;
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  async function forLoop(assets, xchangeName, exchange, isMounted) {
    let total = 0;
    try {
      for (const [key, value] of assets.entries()) {
        if (key.match(/USD|EUR|GBP|USDT|BUSD|USDC/)) {
          if (key.match(/USD|USDT|BUSD|USDC/)) {
            total = total + value;
          } else {
            //convert to USD
            let rate = rateArrayGlobal.find((x) => x.currency === key);
            if (rate) {
              let usd_value = value / rate.rate;
              if (xchangeName == "coinbase" && key == "GBP")
                console.log("GBP", value, usd_value);
              total = total + usd_value;
            } else {
              console.log("no rate found for " + key);
            }
          }
        } else {
          let keypair = "";
          if (xchangeName === "binance") {
            keypair = `${key}/BUSD`;
          } else {
            keypair = `${key}/USD`;
          }

          const ticks = await exchange
            .fetchTicker(keypair)
            .then((ticker) => {
              let usd_value = value * ticker.last;
              total = total + usd_value;
            })
            .catch((err) => console.log(err));
        }
      }

      if (total >= 0) {
        setTotalBalance(total);
      }
    } catch (err) {
      console.log("error-" + xchangeName, err);
    }
  }
  return (
    <div>
      <div width="100%" height={400}>
        {xchangeName.toUpperCase()} {nickname && " / " + nickname}: $
        {totalBalance && typeof totalBalance === "number" ? (
          totalBalance.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
        ) : (
          <>0</>
        )}
        {handleClick(totalBalance)}
      </div>
    </div>
  );
}
