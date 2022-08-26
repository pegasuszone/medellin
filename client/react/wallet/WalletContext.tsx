import { createContext, ReactNode, useState, useEffect } from "react";
import { useWalletManager } from "@cosmos-wallet/react";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { SigningStargateClient } from "@cosmjs/stargate";
import { OfflineSigner } from "@cosmjs/proto-signing";
import { WalletData } from "client/core/wallet";
import chainInfo from "client/ChainInfo";

// Wallet context

// The wallet context provides wallet information (name, address) and signing clients to the app,
// to sign transactions and communicate directly with Stargate or CosmWasm contracts.

// OfflineSigner allows the signing of simple wallet transactions like the transfer of funds.
// SigningCosmWasmClient allows execution of CosmWasm contracts like when minting an NFT.
// SigningStargateClient allows communication with the Cosmos SDK (used when emitting cosmos messages like delegation or voting).

export interface WalletContext {
  connect: () => void;
  disconnect: () => void;
  refreshBalance: () => void;
  offlineSigner?: OfflineSigner;
  signingCosmWasmClient?: SigningCosmWasmClient;
  signingStargateClient?: SigningStargateClient;
  wallet?: WalletData;
}

export const Wallet = createContext<WalletContext>({
  connect: () => {},
  disconnect: () => {},
  refreshBalance: () => {},
  offlineSigner: undefined,
  signingCosmWasmClient: undefined,
  signingStargateClient: undefined,
  wallet: undefined,
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  // Current wallet data
  const [wallet, setWallet] = useState<WalletData>();
  const [offlineSigner, setOfflineSigner] = useState<OfflineSigner>();
  const [signingCosmWasmClient, setSigningCosmWasmClient] =
    useState<SigningCosmWasmClient>();
  const [signingStargateClient, setSigningStargateClient] =
    useState<SigningStargateClient>();

  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  const {
    connect: connectWallet,
    disconnect: disconnectWallet,
    connectedWallet,
  } = useWalletManager();

  const refreshBalance = () => {
    setRefreshCounter(refreshCounter + 1);
  };

  // Refresh the wallet's balance when the refresh counter is incremented
  useEffect(() => {
    async function effect() {
      if (connectedWallet) {
        const balance = await connectedWallet.signingCosmWasmClient?.getBalance(
          connectedWallet.address,
          chainInfo.currencies[0].coinMinimalDenom
        );

        // Set the wallet data
        setWallet({
          address: connectedWallet.address,
          name: connectedWallet.name,
          balance,
        });
      }
    }
    effect();
  }, [refreshCounter]);

  // When connectedWallet changes, we extract the info we need and save it to `wallet`.
  // If it's become `null`, we also set `wallet` to `null`.
  useEffect(() => {
    async function effect() {
      if (connectedWallet) {
        // Fetch the user's balance from the signing cosmwasm client
        const balance = await connectedWallet.signingCosmWasmClient?.getBalance(
          connectedWallet.address,
          chainInfo.currencies[0].coinMinimalDenom
        );

        // Set the wallet data
        setWallet({
          address: connectedWallet.address,
          name: connectedWallet.name,
          balance,
        });

        // Get all other signers
        // They are state vars so that when they are updated StargazeClient is also udpated
        setOfflineSigner(connectedWallet.offlineSigner);
        setSigningCosmWasmClient(
          connectedWallet.signingCosmWasmClient as unknown as SigningCosmWasmClient
        );
        setSigningStargateClient(
          connectedWallet.signingStargateClient as unknown as SigningStargateClient
        );
      } else {
        // No wallet = no data
        setWallet(undefined);
        setOfflineSigner(undefined);
        setSigningCosmWasmClient(undefined);
        setSigningStargateClient(undefined);
      }
    }
    effect();
  }, [connectedWallet]);

  const connect = () => {
    connectWallet();
  };
  const disconnect = () => {
    disconnectWallet();
  };

  return (
    <Wallet.Provider
      value={{
        connect,
        disconnect,
        refreshBalance,
        offlineSigner,
        signingCosmWasmClient,
        signingStargateClient,
        wallet,
      }}
    >
      {children}
    </Wallet.Provider>
  );
};
