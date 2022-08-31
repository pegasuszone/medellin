import type { AppProps } from "next/app";
import WalletProvider from "client/react/wallet/WalletProvider";
import { TxProvider } from "contexts/tx";
import { ToasterContainer } from "hooks/useToaster";
import Layout from "components/Layout";
import ReactTooltip from "@huner2/react-tooltip";

import "animate.css";
import "styles/globals.css";
import "styles/wallet.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <TxProvider>
        <ToasterContainer containerClassName="md:mt-24" position="top-right" />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </TxProvider>
    </WalletProvider>
  );
}

export default MyApp;
