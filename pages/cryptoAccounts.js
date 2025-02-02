import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import axios from "axios";

//Layout
import Layout from "@/components/Layout";
import RoundedContainer from "@/components/LayoutParts/RoundedContainer";

import ListingForm from "@/components/Forms/ListingForm";
import CEXAPIForm from "@/components/Forms/CEXAPIForm";
import { useTable } from "react-table";
import toast from "react-hot-toast";
import ExchangeBalance from "@/components/ChartComponents/ExchangeBalance";
import ccxt from "ccxt";
import getExchangeTotals from "@/lib/getExchangeTotals";
import { responseSymbol } from "next/dist/server/web/spec-compliant/fetch-event";
import parseFromString from "@/lib/xmlhelper";
import * as dfd from "danfojs";
import { Chart } from "react-google-charts";
import { prisma } from "@/lib/prisma";

const CURRENCY_SIGN = "$";

export async function getServerSideProps(context) {
  // Check if user is authenticated
  const session = await getSession(context);

  // If not, redirect to the homepage
  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  // Get all homes from the authenticated user
  const apikeys = await prisma.apikeys.findMany({
    // @ts-ignore
    where: { owner: { ownerId: session.user.id } },
  });

  // Pass the data to the Homes component
  return {
    props: {
      apikeys: JSON.parse(JSON.stringify(apikeys)),
    },
  };
}
let sortedSpotAssetDataforPie = [];
const CryptoAccounts = ({ apikeys = [] }) => {
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingRow, setDeletingRow] = useState(-1);
  const [keys, setKeys] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [exchangeData, setExchangeData] = useState([]);
  const [count, setCount] = useState(0);
  const [spotAssetData, setSpotAssetData] = useState([]);
  const [exchangePositions, setExchangePositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  // Call this function whenever you want to
  // refresh props!
  const refreshData = () => {
    router.replace(router.asPath);
  };

  const asortedSpotAssetDataforPieKey = (data) =>
    axios.post("/api/cexapikey", data);

  const deleteApiKey = async (/** @type {any} */ rowId) => {
    setDeletingRow(rowId);
    let toastId;
    try {
      toastId = toast.loading("Deleting...");
      setDeleting(true);
      // Delete home from DB
      await axios.delete(`/api/apikeys/${rowId}`);
      // Redirect user
      toast.success("Successfully deleted", { id: toastId });
      refreshData();
      setDeleting(false);
      setDeletingRow(-1);
    } catch (e) {
      console.log(e);
      toast.error("Unable to delete key", { id: toastId });
      setDeleting(false);
      setDeletingRow(-1);
    }
  };

  // check if exchange requiredCredentials with ccxt and return true or false if passphrase is needed
  const handleClick = (num) => {
    // 👇️ take parameter passed from Child component
    totalExerciseCount += num;
    setCount(totalExerciseCount);
  };
  let totalExerciseCount = 0;

  const fetchData = async () => {
    setLoading(true);

    const proxy = "https://c123anywhere.herokuapp.com/";

    let promises = [];
    if (apikeys?.length > 0) {
      for (let i = 0; i < apikeys.length; i++) {
        let apikey = apikeys[i];
        promises.push(
          await getExchangeTotals(
            apikey.exchange,
            apikey.apikey,
            apikey.secretkey,
            apikey.passphrase,
            apikey.subaccount,
            apikey.nickname,
            apikey.uid,
            proxy
          )
        );
      }
    }
    const results = await Promise.all(promises);
    let adata = [];
    let pos = [];
    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      adata.push(result[0]);
      pos.push(result[1]);
    }

    let allSpotExchangeData = []; // to contain all the result spot arrays
    let allPosArrays = []; // to contain all the result postition arrays

    allSpotExchangeData = adata.flat();
    allSpotExchangeData.sort(); // flatten and sort to make it easier to read
    //console.log("allSpotExchangeDataCro", allSpotExchangeData);

    allPosArrays = pos.flat();
    allPosArrays.sort(); // flatten and sort to make it easier to read
    //console.log("allPosArraysCro", allPosArrays);

    var sumOfAllSpotTotals = allSpotExchangeData.reduce(function (acc, obj) {
      return acc + obj.total;
    }, 0);
    //console.log("sumOfAllTotals", sumOfAllSpotTotals);
    setTotalBalance(sumOfAllSpotTotals);

    const res = Array.from(
      allSpotExchangeData.reduce(
        (m, { renamed_asset, total }) =>
          m.set(renamed_asset, (m.get(renamed_asset) || 0) + total),
        new Map()
      ),
      ([renamed_asset, total]) => ({ renamed_asset, total })
    ); //set a rename_asset as the key and total as the value and then reduce to a single object

    sortedSpotAssetDataforPie = []; // an array to hold all the assets over different exchanges for the pie chart
    sortedSpotAssetDataforPie.push(["Asset", "Total  "]);
    for (let i = 0; i < res.length; i++) {
      sortedSpotAssetDataforPie.push([res[i].renamed_asset, res[i].total]);
    }
    // => 235;
    //console.log("sortedSpotAssetDataforPieCro", sortedSpotAssetDataforPie);
    setSpotAssetData(sortedSpotAssetDataforPie);
    // or use arrow functions
    setExchangeData(allSpotExchangeData);
    setExchangePositions(allPosArrays);

    setLoading(false);
  };

  const MINUTE_MS = 60000;

  useEffect(() => {
    //const interval = setInterval(() => {
    fetchData()
      // make sure to catch any error
      .catch(console.error);
    //}, MINUTE_MS);

    //return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [apikeys]);

  const options = {
    title:
      "Totals: " +
      CURRENCY_SIGN +
      totalBalance.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,"),
  };
  return (
    <Layout>
      <div className="">
        <>
          <RoundedContainer>
            {spotAssetData ? (
              <Chart
                chartType="PieChart"
                data={spotAssetData}
                options={options}
                width={"100%"}
                height={"400px"}
              />
            ) : (
              <>No Chart</>
            )}
          </RoundedContainer>
        </>
        <div className="flex flex-col">
          {totalBalance && typeof totalBalance === "number" ? (
            "$" +
            totalBalance.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
          ) : (
            <>No USD</>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 border-b border-gray-200">
          {!loading ? (
            <>
              {" "}
              <RoundedContainer>
                {exchangeData &&
                  console.log("exchangeDataspOSSSSS", exchangeData)}
                <table className="table-auto text-sm border-separate border-spacing-2 border border-slate-100">
                  <thead>
                    <tr>
                      <th>Exchange</th>
                      <th>Nickname</th>
                      <th>asset</th>
                      <th>QTY</th>
                      <th>usdrate</th>
                      <th>total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeData &&
                      exchangeData.map((exchangeZ, idx) => (
                        <tr key={idx}>
                          <td>{exchangeZ.exchange}</td>
                          <td>{exchangeZ.nickname}</td>
                          <td>{exchangeZ.asset}</td>
                          <td>{exchangeZ.qty}</td>
                          <td>{exchangeZ.usdrate}</td>
                          <td>{exchangeZ.total}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </RoundedContainer>
              <RoundedContainer>
                {exchangePositions &&
                  console.log("exchangePositionspOSSSSS", exchangePositions)}
                <table className="table-auto text-sm border-separate border-spacing-2 border border-slate-100">
                  <thead>
                    <tr>
                      <th>asset</th>
                      <th>Side</th>
                      <th>Size</th>
                      <th>Entry Price</th>
                      <th>Leverage</th>
                      <th>usdrate</th>
                      <th>total</th>
                      <th>pnl</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangePositions && exchangePositions.length > 0 ? (
                      exchangePositions.map((position, idx) => (
                        <tr key={idx}>
                          <td>{position.info.future}</td>
                          <td>{position.side}</td>
                          <td>{position.info.size}</td>
                          <td>{position.info.recentBreakEvenPrice}</td>
                          <td>{position.leverage}</td>
                          <td>{position.info.future}</td>
                          <td>{position.info.future}</td>
                          <td>{position.info.recentPnl}</td>
                        </tr>
                      ))
                    ) : (
                      <></>
                    )}
                  </tbody>
                </table>
              </RoundedContainer>{" "}
            </>
          ) : (
            <RoundedContainer>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 mt-3 mb-6 rounded"></div>
                <div className="h-4 bg-gray-300 mb-6 rounded"></div>
                <div className="h-4 bg-gray-200 mb-6 rounded"></div>
                <div className="h-4 bg-gray-300 mb-6 rounded"></div>
                <div className="h-4 bg-gray-200 mb-6 rounded"></div>
              </div>
            </RoundedContainer>
          )}
        </div>
      </div>
      <RoundedContainer>
        {/* {apikeys.map((apikey) => (
          <ExchangeBalance
            key={apikey.id}
            exchangeName={apikey.exchange}
            apikey={apikey.apikey}
            secretkey={apikey.secretkey}
            passphrase={apikey.passphrase}
            nickname={apikey.nickname}
            subaccount={apikey.subaccount}
            uid={apikey.uid}
            handleClick={handleClick}
          />
        ))} */}
        <h2>
          Count: $
          {(count / 2).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")}
        </h2>
        <h1 className="text-xl font-medium text-gray-800">Your API Keys</h1>
        <p className="text-gray-500">Add a new key at the bottom.</p>

        <div className="mt-8 overflow-x-auto relative ">
          <table className="table-auto text-sm border-separate border-spacing-2 border border-slate-100w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="border border-slate-200 truncate text-ellipsis">
                  Exhange
                </th>
                <th className="border border-slate-200 truncate text-ellipsis">
                  Nickname
                </th>
                <th className="border border-slate-200 truncate text-ellipsis">
                  Subaccount
                </th>
                <th className="border border-slate-200 max-w-xs truncate text-ellipsis">
                  API Key
                </th>
                <th className="border border-slate-200 max-w-xs truncate text-ellipsis">
                  Secret Key
                </th>
                <th className="border border-slate-200 truncate text-ellipsis">
                  Passphrase
                </th>
                <th className="border border-slate-200 truncate text-ellipsis">
                  Uid
                </th>
                <th className="border border-slate-200 truncate text-ellipsis">
                  🗑
                </th>
              </tr>
            </thead>
            <tbody>
              {apikeys &&
                apikeys.map((apikey) =>
                  deleting && deletingRow === apikey.id ? (
                    <tr>deleting...</tr>
                  ) : (
                    <tr
                      key={apikey.id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <th className="font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {apikey.exchange}
                      </th>
                      <td className="border border-slate-200 truncate text-ellipsis">
                        {apikey.nickname}
                      </td>
                      <td className="border border-slate-200 truncate text-ellipsis">
                        {apikey.subaccount}
                      </td>
                      <td className="border border-slate-200 max-w-xs  overflow-hidden truncate text-ellipsis">
                        {apikey.apikey}
                      </td>
                      <td className="border border-slate-200 max-w-xs truncate text-ellipsis overflow-hidden">
                        {apikey.secretkey}
                      </td>
                      <td className="border border-slate-200 truncate text-ellipsis">
                        {apikey.passphrase && apikey.passphrase}
                      </td>
                      <td className="border border-slate-200 truncate text-ellipsis">
                        {apikey.uid && apikey.uid}
                      </td>
                      <td className="border border-slate-200 ">
                        <a href="#" onClick={() => deleteApiKey(apikey.id)}>
                          &#10060;
                        </a>
                      </td>
                    </tr>
                  )
                )}
            </tbody>
          </table>
        </div>
        <div className="mt-8">
          <CEXAPIForm
            buttonText="Add Key"
            redirectPath="/cryptoAccounts"
            onSubmit={asortedSpotAssetDataforPieKey}
          />
        </div>
      </RoundedContainer>
    </Layout>
  );
};

export default CryptoAccounts;
