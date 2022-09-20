import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import axios from "axios";
import Layout from "@/components/Layout";
import ListingForm from "@/components/Forms/ListingForm";
import CEXAPIForm from "@/components/Forms/CEXAPIForm";
import { useTable } from "react-table";
import toast from "react-hot-toast";
import FTXPie from "@/components/ChartComponents/FTXPie";
import ExchangeBalance from "@/components/ChartComponents/ExchangeBalance";
import ccxt from "ccxt";
import getExchangeTotals from "@/lib/getExchangeTotals";
import { responseSymbol } from "next/dist/server/web/spec-compliant/fetch-event";
import parseFromString from "@/lib/xmlhelper";
import * as dfd from "danfojs";
import { Chart } from "react-google-charts";
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
    where: { owner: { ownerId: session.user.id } },
  });

  // Pass the data to the Homes component
  return {
    props: {
      apikeys: JSON.parse(JSON.stringify(apikeys)),
    },
  };
}
let dd = [];
const CryptoAccounts = ({ apikeys = [] }) => {
  const [isOwner, setIsOwner] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keys, setKeys] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [exchangeData, setExchangeData] = useState([]);
  const [count, setCount] = useState(0);
  const [rateArray, setRateArray] = useState([]);
  const [exchangePositions, setExchangePositions] = useState([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  // Call this function whenever you want to
  // refresh props!
  const refreshData = () => {
    router.replace(router.asPath);
  };

  const addKey = (data) => axios.post("/api/cexapikey", data);

  const deleteApiKey = async (rowId) => {
    let toastId;
    try {
      toastId = toast.loading("Deleting...");
      setDeleting(true);
      // Delete home from DB
      await axios.delete(`/api/apikeys/${rowId}`);
      // Redirect user
      toast.success("Successfully deleted", { id: toastId });
      refreshData();
    } catch (e) {
      console.log(e);
      toast.error("Unable to delete key", { id: toastId });
      setDeleting(false);
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

    console.log("resultsCro", results);
    console.log("adataCrp", adata);
    console.log("posCro", pos.flat());


    

    let allArraysX = [];
    console.log("adataCrotype", typeof adata);
    allArraysX = adata;

    allArraysX.sort();
    console.log("allArraysXCro", allArraysX);

    setTotalBalance(
      allArraysX.reduce(
        (accumulator, current) => accumulator + current.qty * current.usdrate,
        0
      )
    );
    function sum_vals(col) {
      return col.reduce((a, b) => a + b, 0);
    }
    function amount(item) {
      return item.qty;
    }

    function sum(prev, next) {
      return prev + next;
    }

    allArraysX.map(amount).reduce(sum);

    const res = Array.from(
      allArraysX.reduce(
        (m, { renamed_asset, total }) =>
          m.set(renamed_asset, (m.get(renamed_asset) || 0) + total),
        new Map()
      ),
      ([renamed_asset, total]) => ({ renamed_asset, total })
    );

    dd = [];
    dd.push(["AsseCrot", "Total  "]);
    for (let i = 0; i < res.length; i++) {
      dd.push([res[i].renamed_asset, res[i].total]);
    }
    // => 235;
    console.log("ddCro", dd);
    setRateArray(dd);
    // or use arrow functions
    allArraysX.map((item) => item.qty).reduce((prev, next) => prev + next);
    setExchangeData(allArraysX);
    console.log("positionsCro", typeof pos);
    let positions = pos;

    setExchangePositions(positions);

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
      <div>
        <>
          {rateArray ? (
            <Chart
              chartType="PieChart"
              data={rateArray}
              options={options}
              width={"100%"}
              height={"400px"}
            />
          ) : (
            <>No Chart</>
          )}
        </>
        <div className="flex flex-col">
          {totalBalance && typeof totalBalance === "number" ? (
            "$" +
            totalBalance.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
          ) : (
            <>No USD</>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {!loading ? (
            <>
              {" "}
              <div>
                <table className="table-fixed text-sm border-separate border-spacing-2 border border-slate-100">
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
              </div>
              <div>
                {exchangePositions && exchangePositions.length > 0 ? (
                  exchangePositions.map((position, idx) => (
                    <div key={idx}>
                      <div className="flex flex-col">
                        {console.log("pOSSSSS", position)}
                        {position.length > 0 && position.symbol}
                        {position.length > 0 && position.info}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>No Positions</div>
                )}
              </div>{" "}
            </>
          ) : (
            <div>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 mt-3 mb-6 rounded"></div>
                <div className="h-4 bg-gray-300 mb-6 rounded"></div>
                <div className="h-4 bg-gray-200 mb-6 rounded"></div>
                <div className="h-4 bg-gray-300 mb-6 rounded"></div>
                <div className="h-4 bg-gray-200 mb-6 rounded"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="max-w-screen mx-auto">
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
        <div className="mt-8">
          <table className="table-fixed text-sm border-separate border-spacing-2 border border-slate-100">
            <thead>
              <tr>
                <th className="border border-slate-200" nowrap="nowrap">
                  Exhange
                </th>
                <th className="border border-slate-200" nowrap="nowrap">
                  Nickname
                </th>
                <th className="border border-slate-200" nowrap="nowrap">
                  Subaccount
                </th>
                <th
                  className="border border-slate-200 max-w-xs"
                  nowrap="nowrap"
                >
                  API Key
                </th>
                <th
                  className="border border-slate-200 max-w-xs"
                  nowrap="nowrap"
                >
                  Secret Key
                </th>
                <th className="border border-slate-200" nowrap="nowrap">
                  Passphrase
                </th>
                <th className="border border-slate-200" nowrap="nowrap">
                  Uid
                </th>
                <th className="border border-slate-200" nowrap="nowrap">
                  🗑
                </th>
              </tr>
            </thead>
            <tbody>
              {apikeys &&
                apikeys.map((apikey) => (
                  <tr key={apikey.id}>
                    <td className="border border-slate-200" nowrap="nowrap">
                      {apikey.exchange}
                    </td>
                    <td className="border border-slate-200" nowrap="nowrap">
                      {apikey.nickname}
                    </td>
                    <td className="border border-slate-200" nowrap="nowrap">
                      {apikey.subaccount}
                    </td>
                    <td
                      className="border border-slate-200 max-w-xs  overflow-hidden"
                      nowrap="nowrap"
                    >
                      {apikey.apikey}
                    </td>
                    <td
                      className="border border-slate-200 max-w-xs  overflow-hidden"
                      nowrap="nowrap"
                    >
                      {apikey.secretkey}
                    </td>
                    <td className="border border-slate-200" nowrap="nowrap">
                      {apikey.passphrase && apikey.passphrase}
                    </td>
                    <td className="border border-slate-200" nowrap="nowrap">
                      {apikey.uid && apikey.uid}
                    </td>
                    <td className="border border-slate-200" nowrap="nowrap">
                      <a href="#" onClick={() => deleteApiKey(apikey.id)}>
                        &#10060;
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="mt-8">
          <CEXAPIForm
            buttonText="Add Key"
            redirectPath="/cryptoAccounts"
            onSubmit={addKey}
          />
        </div>
      </div>
    </Layout>
  );
};

export default CryptoAccounts;
