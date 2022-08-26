import React from "react";
import { StargazeClient } from "client/core";

const StargazeClientContext = React.createContext<{
  client: StargazeClient | null;
  connectSigning: () => void;
}>({
  client: null,
  connectSigning: () => {},
});
export default StargazeClientContext;
