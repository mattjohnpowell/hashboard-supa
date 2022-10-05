import React, { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
//libs
import { prisma } from "@/lib/prisma";
import getExchangeTotals from "@/lib/getExchangeTotals";
//layout
import Layout from "@/components/Layout";
import RoundedContainer from "@/components/LayoutParts/RoundedContainer";
import RoundedContainerSingleFigure from "@/components/LayoutParts/RoundedContainerSingleFigure";
import DashPanel from "@/components/LayoutParts/DashPanel";
import { Chart } from "react-google-charts";
//network
import axios from "axios";
import toast from "react-hot-toast";
import TopMovers from "./../components/LayoutParts/TopMovers";
import {
  HiCurrencyDollar,
  HiCurrencyPound,
  HiCurrencyEuro,
} from "react-icons/hi";
const CURRENCY_SIGN = "$";
const totalBalance = 80000;

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
const Dashboard = ({ apikeys = [] }) => {
  const [spotAssetData, setSpotAssetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBalance, setTotalBalance] = useState(0);
  const [exchangeData, setExchangeData] = useState([]);
  const [exchangePositions, setExchangePositions] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();
  // Call this function whenever you want to
  // refresh props!
  const refreshData = () => {
    router.replace(router.asPath);
  };

  const asortedSpotAssetDataforPieKey = (data) =>
    axios.post("/api/cexapikey", data);

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

  const data = [
    ["ID", "Life Expectancy", "Fertility Rate", "Region", "Population"],
    ["CAN", 80.66, 1.67, "North America", 33739900],
    ["DEU", 79.84, 1.36, "Europe", 81902307],
    ["DNK", 78.6, 1.84, "Europe", 5523095],
    ["EGY", 72.73, 2.78, "Middle East", 79716203],
    ["GBR", 80.05, 2, "Europe", 61801570],
    ["IRN", 72.49, 1.7, "Middle East", 73137148],
    ["IRQ", 68.09, 4.77, "Middle East", 31090763],
    ["ISR", 81.55, 2.96, "Middle East", 7485600],
    ["RUS", 68.6, 1.54, "Europe", 141850000],
    ["USA", 78.09, 2.05, "North America", 307007000],
  ];

  const bubbleOptions = {
    title:
      "Correlation between life expectancy, fertility rate " +
      "and population of some world countries (2010)",
    hAxis: { title: "Life Expectancy" },
    vAxis: { title: "Fertility Rate" },
    bubble: { textStyle: { fontSize: 11 } },
  };

  return (
    <Layout>
      <DashPanel>
        <RoundedContainerSingleFigure
          title="USD Balance"
          className="text-green-800"
        >
          <div className="flex">
            <div className="min-h-full">
              <HiCurrencyDollar className="min-h-full"></HiCurrencyDollar>
            </div>
            <div>
              {totalBalance && typeof totalBalance === "number" ? (
                "$" +
                totalBalance
                  .toFixed(2)
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
              ) : (
                <>No USD</>
              )}
            </div>
          </div>
        </RoundedContainerSingleFigure>
        <RoundedContainerSingleFigure
          title="GBP Balance"
          className="text-red-700"
        >
          <div className="flex">
            <div className="min-h-full">
              <HiCurrencyPound className="min-h-full"></HiCurrencyPound>
            </div>
            <div>
              {totalBalance && typeof totalBalance === "number" ? (
                "$" +
                totalBalance
                  .toFixed(2)
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
              ) : (
                <>No USD</>
              )}
            </div>
          </div>
        </RoundedContainerSingleFigure>
        <RoundedContainerSingleFigure
          title="EUR Balance"
          className="text-blue-800"
        >
          <div className="flex">
            <div className="min-h-full">
              <HiCurrencyEuro className="min-h-full"></HiCurrencyEuro>
            </div>
            <div>
              {totalBalance && typeof totalBalance === "number" ? (
                "$" +
                totalBalance
                  .toFixed(2)
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
              ) : (
                <>No USD</>
              )}
            </div>
          </div>
        </RoundedContainerSingleFigure>
        <RoundedContainerSingleFigure>
          <TopMovers>
            <div></div>
          </TopMovers>
        </RoundedContainerSingleFigure>
      </DashPanel>

      <RoundedContainer>
        <Chart
          chartType="BubbleChart"
          width="100%"
          height="400px"
          data={data}
          options={bubbleOptions}
        />
      </RoundedContainer>
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
        <div className="flex flex-col"></div>
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
    </Layout>
  );
};
export default Dashboard;
