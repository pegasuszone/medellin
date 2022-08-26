import { useCallback, useEffect, useMemo, useState } from "react";
import { StargazeClient } from "client/core";
import StargazeContext from "./StargazeContext";

import { CONTRACT_ADDRESS, CONTRACT_CODEID } from "util/constants";
import chainInfo from "client/ChainInfo";
import useWallet from "../wallet/useWallet";

export default function StargazeProvider({
  children,
}: {
  children: JSX.Element;
}) {
  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const { wallet, signingCosmWasmClient } = useWallet();

  const client = useMemo(
    () =>
      new StargazeClient({
        wallet: wallet || null,
        chainInfo,
        tradeContract: CONTRACT_ADDRESS,
        tradeCodeId: CONTRACT_CODEID,
        signingCosmWasmClient: signingCosmWasmClient || null,
      }),
    [wallet, signingCosmWasmClient]
  );

  const connectSigning = useCallback(async () => {
    if (client) {
      await client?.connectSigning();
      forceUpdate();
    }
  }, [client, forceUpdate]);

  // Connect client
  useEffect(() => {
    // Unsigned Client
    async function connectClient() {
      await client?.connect();
      console.log("CONNECT", client);
      forceUpdate();
    }

    connectClient();
  }, [client, forceUpdate]);

  return (
    <StargazeContext.Provider
      value={{
        client,
        connectSigning,
      }}
    >
      {children}
    </StargazeContext.Provider>
  );
}
