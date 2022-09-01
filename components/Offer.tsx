import { useStargazeClient, useWallet } from "client";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { Offer } from "types/contract";
import { fetchNfts } from "util/nft";
import { getNftMod, Media } from "util/type";
import Address from "./Address";
import ReactTooltip from "@huner2/react-tooltip";
import { Modal } from "./Modal";

const OfferNft = ({ nft }: { nft: Media }) => {
  return (
    <a
      rel="noopener noreferrer"
      target="_blank"
      href={`${process.env.NEXT_PUBLIC_STARGAZE_BASE_URL!}/media/${
        nft.collection.contractAddress
      }/${nft.tokenId}`}
    >
      <ReactTooltip
        effect="solid"
        type="info"
        className="tooltip"
        arrowColor="rgba(0,0,0,0)"
      />
      <img
        src={nft.image}
        key={getNftMod(nft)}
        className="object-cover w-24 h-24 rounded-md cursor-pointer hover:shadow-xl"
        data-tip={nft.name}
      />
    </a>
  );
};

export default function OfferView({ offer }: { offer: Offer }) {
  const { wallet } = useWallet();
  const { client } = useStargazeClient();
  const isSender = offer.sender === wallet?.address;
  const isPeer = offer.peer === wallet?.address;

  const [offeredNfts, setOfferedNfts] = useState<Media[]>();
  const [wantedNfts, setWantedNfts] = useState<Media[]>();

  const [isLoading, setIsLoading] = useState<boolean>();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch wanted & offered nfts
  useEffect(() => {
    if (wallet && client) {
      fetchNfts(offer.offered_nfts, client).then((nfts) =>
        setOfferedNfts(nfts)
      );
      fetchNfts(offer.wanted_nfts, client).then((nfts) => setWantedNfts(nfts));
    }
  }, [wallet, client]);

  useEffect(() => {
    if (wantedNfts && offeredNfts) {
      setIsLoading(false);
    } else if (!wantedNfts || !offeredNfts) {
      setIsLoading(true);
    }
  }, [wantedNfts, offeredNfts]);

  return (
    <>
      <Modal isModalOpen={isModalOpen} />
      <div className="flex flex-col p-4 border rounded-lg border-white/10">
        <div className="grid grid-cols-2 gap-12">
          <Address address={offer.sender} copy />
          <Address address={offer.peer} />
        </div>
        <div className="grid grid-cols-2 gap-12 mt-4">
          <div className="flex flex-row space-x-4">
            {offeredNfts?.slice(0, 2).map((nft) => (
              <OfferNft nft={nft} />
            ))}
          </div>
          <div className="flex flex-row space-x-4">
            {wantedNfts?.slice(0, 2).map((nft) => (
              <OfferNft nft={nft} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 pt-4 mt-4 border-t border-white/10">
          <div className="flex items-center">
            <p className="font-medium text-white/75">
              Offer expires 12-24-2022
            </p>
          </div>
          <div className="space-x-4 lg:flex lg:flex-row lg:justify-end lg:items-center">
            <button className="inline-flex items-center justify-center h-10 text-xs font-medium text-white border border-white rounded-lg lg:w-32 hover:bg-primary hover:border-none">
              Details
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center h-10 text-xs font-medium text-white rounded-lg lg:w-32 bg-primary hover:bg-primary-500"
            >
              Reply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
