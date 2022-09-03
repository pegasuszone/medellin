import { useStargazeClient, useWallet } from "client";
import { Header } from "components";
import OfferView from "components/Offer";
import { useCallback, useEffect, useState } from "react";
import { Offer } from "types/contract";

const Inbox = () => {
  const { client } = useStargazeClient();
  const { wallet } = useWallet();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offers, setOffers] = useState<Offer[]>();

  const [refreshCounter, setRefreshCounter] = useState<number>(0);
  const refresh = useCallback(() => {
    setRefreshCounter(refreshCounter + 1);
  }, [refreshCounter]);

  useEffect(() => {
    if (wallet && client?.tradeClient) {
      setIsLoading(true);
      client?.tradeClient
        ?.offersByPeer({
          peer: wallet.address,
        })
        .then((data) => {
          setIsLoading(false);
          setOffers(data?.offers || []);
        });
    } else {
      setIsLoading(false);
      setOffers(undefined);
    }
  }, [wallet, client?.tradeClient, refreshCounter]);

  useEffect;
  return (
    <main>
      <Header>Inbox</Header>
      {!wallet && (
        <p className="text-lg font-light text-white">
          Connect a wallet to access your inbox.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {offers?.map((offer) => (
          <OfferView offer={offer} actionCallback={refresh} />
        ))}
      </div>
    </main>
  );
};

export default Inbox;
