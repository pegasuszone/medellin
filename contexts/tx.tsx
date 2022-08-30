import { createContext, ReactNode, useContext } from "react";
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { isDeliverTxSuccess } from "@cosmjs/stargate";
import { coins } from "@cosmjs/stargate";
import { ArrowTopRightOnSquareIcon as LinkIcon } from "@heroicons/react/24/outline";
import useToaster, { ToastPayload, ToastTypes } from "hooks/useToaster";
import { useStargazeClient, useWallet } from "client";

// Context to handle simple signingClient transactions
export interface Msg {
  typeUrl: string;
  value: any;
}

export interface TxOptions {
  party?: boolean;
  toast?: {
    title?: ToastPayload["title"];
    message?: ToastPayload["message"];
    type?: ToastTypes;
    actions?: JSX.Element;
  };
}

const fee = {
  amount: coins(0, process.env.NEXT_PUBLIC_DEFAULT_GAS_DENOM!),
  gas: process.env.NEXT_PUBLIC_DEFAULT_GAS_FEE!,
};

export interface TxContext {
  tx: (msgs: Msg[], options: TxOptions, callback?: () => void) => Promise<void>;
}

export const Tx = createContext<TxContext>({
  tx: () => new Promise(() => {}),
});

export function TxProvider({ children }: { children: ReactNode }) {
  const { wallet, refreshBalance } = useWallet();
  const { client } = useStargazeClient();
  const signingCosmwasmClient = client?.signingCosmWasmClient;

  const toaster = useToaster();

  // Method to sign & broadcast transaction
  const tx = async (msgs: Msg[], options: TxOptions, callback?: () => void) => {
    // Broadcast the redelegation message to Keplr
    let signed;
    try {
      if (wallet?.address) {
        signed = await signingCosmwasmClient?.sign(
          wallet?.address,
          msgs,
          fee,
          ""
        );
      }
    } catch (e: any) {
      toaster.toast({
        title: "Error",
        dismissable: true,
        message: e.message as string,
        type: ToastTypes.Error,
      });
    }

    let broadcastToastId = "";

    if (signingCosmwasmClient && signed) {
      await signingCosmwasmClient
        .broadcastTx(Uint8Array.from(TxRaw.encode(signed).finish()))
        .then((res) => {
          toaster.dismiss(broadcastToastId);
          if (isDeliverTxSuccess(res)) {
            // Run callback
            if (callback) callback();

            // Refresh balance
            refreshBalance();

            toaster.toast({
              title: options.toast?.title || "Transaction Successful",
              type: options.toast?.type || ToastTypes.Success,
              dismissable: true,
              actions: options.toast?.actions || <></>,
              message: options.toast?.message || (
                <>
                  View{" "}
                  <a
                    href={`${
                      process.env.NEXT_PUBLIC_BLOCK_EXPLORER as string
                    }/txs/${res.transactionHash}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline"
                  >
                    transaction in explorer{" "}
                    <LinkIcon className="inline w-3 h-3 text-gray-400 hover:text-gray-500" />
                  </a>
                  .
                </>
              ),
            });
          } else {
            toaster.toast({
              title: "Error",
              message: res.rawLog,
              type: ToastTypes.Error,
            });
          }
        });
    }
  };

  return <Tx.Provider value={{ tx }}>{children}</Tx.Provider>;
}

export const useTx = (): TxContext => useContext(Tx);
