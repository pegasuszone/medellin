import { useContext } from "react";
import StargazeContext from "./StargazeContext";

export default function useStargazeClient() {
  const client = useContext(StargazeContext);
  return client;
}
