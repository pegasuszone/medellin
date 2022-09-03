import type { AppProps } from "next/app";
import WalletProvider from "client/react/wallet/WalletProvider";
import { TxProvider } from "contexts/tx";
import Layout from "components/Layout";
import Head from "next/head";
import { ErrorInfo } from "react";
import { Toaster } from "react-hot-toast";

import "animate.css";
import "styles/globals.css";
import "styles/wallet.css";

function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1, user-scalable=no"
        />
      </Head>
      <Toaster position="top-right" />
      <WalletProvider>
        <TxProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </TxProvider>
      </WalletProvider>
    </>
  );
}

App.componentDidCatch = (error: Error, errorInfo: ErrorInfo) => {
  console.error(error, errorInfo);
};

export default App;
