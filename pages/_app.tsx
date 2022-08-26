import type { AppProps } from "next/app";
import WalletProvider from "client/react/wallet/WalletProvider";
import Layout from "components/Layout";

import "styles/globals.css";
import "styles/wallet.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <WalletProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WalletProvider>
  );
}

export default MyApp;
