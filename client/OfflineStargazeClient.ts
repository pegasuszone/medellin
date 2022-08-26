import { StargazeClient } from "client/core";
import chainInfo from "./ChainInfo";

import { CONTRACT_ADDRESS, CONTRACT_CODEID } from "util/constants";

const client = new StargazeClient({
  wallet: null,
  signingCosmWasmClient: null,
  chainInfo,
  tradeCodeId: CONTRACT_CODEID,
  tradeContract: CONTRACT_ADDRESS,
});

export default client;
