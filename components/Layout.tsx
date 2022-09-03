import React, { ReactNode } from "react";
import { MetaTags } from "components";
import Navigation from "./Navigation";
import { useRouter } from "next/router";

import {
  CubeIcon,
  ArrowsUpDownIcon,
  InboxStackIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { useWallet } from "client";

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { wallet } = useWallet();

  const connectedNavigation = wallet
    ? [
        {
          name: "Trade",
          href: "/trade",
          icon: ArrowsUpDownIcon,
          current: router.asPath.split("/").includes("trade"),
        },
        {
          name: "Sent Offers",
          href: "/sent",
          icon: EnvelopeIcon,
          current: router.asPath.split("/").includes("sent"),
        },
        {
          name: "Inventory",
          href: "/inventory",
          icon: CubeIcon,
          current: router.asPath.split("/").includes("inventory"),
        },
      ]
    : [];

  const navigation = [
    {
      name: "Inbox",
      href: "/inbox",
      icon: InboxStackIcon,
      current: router.asPath.split("/").includes("inbox"),
    },
    ...connectedNavigation,
  ];

  return (
    <main id="root" className="w-full min-h-screen bg-firefly">
      <div>
        <MetaTags
          title="Pegasus"
          description="P2P trading platform for Stargaze NFTs"
          image="https://user-images.githubusercontent.com/25516960/186937317-b16cc010-fa80-4a5e-a3bb-45e2413242df.png"
          ogImage="https://user-images.githubusercontent.com/25516960/186937317-b16cc010-fa80-4a5e-a3bb-45e2413242df.png"
          url="https://www.pegasus-trade.zone"
        />
        <Navigation navigation={navigation} />
        <div className="px-8 lg:ml-64">{children}</div>
      </div>
    </main>
  );
}
