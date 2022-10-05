import CEXAPIForm from "@/components/Forms/CEXAPIForm";
import Layout from "@/components/Layout";
import RoundedContainer from "@/components/LayoutParts/RoundedContainer";
import { prisma } from "@/lib/prisma";
import axios from "axios";

import { getSession } from "next-auth/react";
import { useRouter } from "next/router";
import React, { useState } from "react";
import toast from "react-hot-toast";

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
  // @ts-ignore
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

const Settings = ({ apikeys = [] }) => {
  const [deleting, setDeleting] = useState(false);
  const [deletingRow, setDeletingRow] = useState(-1);

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
  return (
    <Layout>
      <RoundedContainer>
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
                    <tr className="animate-pulse w-full text-center">
                      {" "}
                      <td className="bg-gray-200 w-full rounded text-center text-lg font-bold" colSpan={8}>Deleting...</td>
                  
                     
                    </tr>
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
            redirectPath="/settings"
            onSubmit={asortedSpotAssetDataforPieKey}
          />
        </div>
      </RoundedContainer>
    </Layout>
  );
};
export default Settings;
