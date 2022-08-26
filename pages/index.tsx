import type { NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import stargazeClient from "client/OfflineStargazeClient";
import { useStargazeClient, useWallet } from "client";
import { useEffect } from "react";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { toUtf8 } from "@cosmjs/encoding/build/utf8";
import { CONTRACT_ADDRESS } from "util/constants";
import { coins } from "@cosmjs/amino";

const fee = {
  amount: coins(0, process.env.NEXT_PUBLIC_DEFAULT_GAS_DENOM!),
  gas: process.env.NEXT_PUBLIC_DEFAULT_GAS_FEE!,
};

const Home: NextPage = () => {
  const { connect, disconnect, wallet } = useWallet();
  const { client } = useStargazeClient();

  async function handleSendTestOffer() {
    const msgs = [
      {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: wallet?.address,
          contract:
            "stars19hzqtwn7hkw655q84kcsry6f3rzg8gfnk38e23dkjdjurt9ctzqqn38yhu",
          msg: toUtf8(
            JSON.stringify({
              approve: {
                spender: CONTRACT_ADDRESS,
                token_id: "94",
              },
            })
          ),
          funds: [],
        }),
      },
      {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: wallet?.address,
          contract: CONTRACT_ADDRESS,
          msg: toUtf8(
            JSON.stringify({
              create_offer: {
                expires_at: "1661445174457000000",
                offered_nfts: [
                  {
                    collection:
                      "stars19hzqtwn7hkw655q84kcsry6f3rzg8gfnk38e23dkjdjurt9ctzqqn38yhu",
                    token_id: 94,
                  },
                ],
                wanted_nfts: [
                  {
                    collection:
                      "stars19hzqtwn7hkw655q84kcsry6f3rzg8gfnk38e23dkjdjurt9ctzqqn38yhu",
                    token_id: 95,
                  },
                ],
                peer: "stars1cyyzpxplxdzkeea7kwsydadg87357qnat6jstn",
              },
            })
          ),
          funds: [],
        }),
      },
    ];

    let signed = await client?.signingCosmWasmClient?.sign(
      wallet?.address!,
      msgs,
      fee,
      ""
    );

    await client?.signingCosmWasmClient
      ?.broadcastTx(Uint8Array.from(TxRaw.encode(signed!).finish()))
      .then((res) => {
        console.log(res);
      });
  }

  return wallet ? (
    <div>
      <p>{wallet.name}</p>
      <button onClick={disconnect}>Disconnect wallet</button>
      <button onClick={handleSendTestOffer}>Send test offer</button>
    </div>
  ) : (
    <button onClick={connect}>Connect wallet</button>
  );
};

export async function getStaticProps() {
  await stargazeClient.connect();

  const data = await stargazeClient.tradeClient?.offersBySender({
    sender: "stars1wx0wqkyymkv278lqrpe9h52exxa87e7exj0ckg",
  });

  console.log(data);

  return { props: {} };
}

export default Home;
