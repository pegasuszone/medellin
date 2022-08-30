import { useWallet } from "client";
import { useEffect, useState } from "react";
import { Offer } from "types/contract";
import { Media } from "util/type";
import Address from "./Address";

export default function Offer({ offer }: { offer: Offer }) {
  const { wallet } = useWallet();
  const isSender = offer.sender === wallet?.address;
  const isPeer = offer.peer === wallet?.address;

  const [wantedNfts, setWantedNfts] = useState<Media>();
  const [offeredNfts, setOfferedNfts] = useState<Media>();

  const [isLoading, setIsLoading] = useState<boolean>();

  useEffect(() => {
    // Load wanted NFTs
  }, []);

  useEffect(() => {
    if (wantedNfts && offeredNfts) {
      setIsLoading(false);
    } else if (!wantedNfts || !offeredNfts) {
      setIsLoading(true);
    }
  }, [wantedNfts, offeredNfts]);

  return (
    <div className="flex flex-col p-3 border rounded-lg border-white/10">
      <div className="grid grid-cols-2 gap-12">
        <div className="grid grid-cols-5"></div>
        <div className="grid grid-cols-5"></div>
      </div>
      <div className="grid grid-cols-2 gap-12">
        <Address address={offer.sender} />
        <Address address={offer.peer} />
      </div>
    </div>
  );
}
