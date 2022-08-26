import chainInfo from "client/ChainInfo";
import { WalletManagerProvider } from "@cosmos-wallet/react";
import { WalletProvider as WalletContextProvider } from "./WalletContext";
import StargazeProvider from "client/react/client/StargazeProvider";
import { ChainInfos } from "config";

// WalletProvider serves multiple purposes:
// - It provides `useWalletManager()` to the wallet context (WalletContext.tsx)
// - It wraps WalletManagerProvider and WalletContext into one simple component you can insert in the root
// - It provides the app access to StargazeClient

export default function WalletProvider({
  children,
}: {
  children: JSX.Element;
}) {
  return (
    <WalletManagerProvider
      defaultChainId={chainInfo.chainId}
      walletConnectClientMeta={{
        name: "Stargaze",
        description:
          "Buy and sell goods and services on the world's foremost crypto goods exchange",
        url: "https://www.stargazeprotocol.zone",
        icons: ["https://i.ibb.co/YWKKR5Y/logo.png"],
      }}
      chainInfoOverrides={ChainInfos}
    >
      <WalletContextProvider>
        <StargazeProvider>{children}</StargazeProvider>
      </WalletContextProvider>
    </WalletManagerProvider>
  );
}
