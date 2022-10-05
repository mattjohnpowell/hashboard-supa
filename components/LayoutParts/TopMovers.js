import React, { useState, useEffect } from "react";
var ccxt = require("ccxt").pro;

const getBal = async ({}) => {
  const [bal, setBal] = useState();
};

const TopMovers = ({ children }) => {
  const [bal, setBal] = useState();
  const proxy = "https://c123anywhere.herokuapp.com/";
  ///const exchange = new ccxt.ftx({'newUpdates': true});
  //exchange.proxy = proxy;
  const [posts, setPosts] = useState();
  let exchange = new ccxt.ftx({enableRateLimit: true});


  //   const exchangeId = "binance";
  //   const exchangeClass = ccxt[exchangeId];
  //   let exchange = new exchangeClass({
  //   proxy: proxy,
  //   apiKey: "2FzXRYZzZuJqPkvsaHSet9P9FFK_t0DOa7I_JaNr",
  //   secret: "N_3pyV5buxojr0K1YzD9kEWgNdnbvNXlx87dO9vI",
  // });


  useEffect(() => {
    async function fetchData() {
       
      if (exchange.has.watchTicker) {

        while (true) {

          try {

            const symbol = "BTC/USD";
            const ticker = await exchange.watchTicker(symbol);

            process.stdout.write("ticker.close " + ticker.close);
            const orderbook = await exchange.watchOrderBook('ETH/BTC')
            //console.log ("orderbook['asks'][0]", orderbook['asks'][0], orderbook['bids'][0])
            // @ts-ignore

            setPosts(parseFloat(ticker.close)
              .toFixed(2)
              .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"));
          } catch (err) {
            console.log(err);
          }
        }
      }
    }
    fetchData();
  }, []);
  return <div>${posts}</div>;
};

export default TopMovers;
