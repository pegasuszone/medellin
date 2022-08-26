import React, { ReactNode } from "react";
import { MetaTags } from "components";
import Navigation from "./Navigation";
import { useRouter } from "next/router";

import {
  CubeIcon,
  ChatBubbleOvalLeftEllipsisIcon as ChatIcon,
  ClockIcon,
  InboxStackIcon,
} from "@heroicons/react/24/outline";

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();

  const navigation = [
    {
      name: "Trade",
      href: "/trade",
      icon: CubeIcon,
      current: router.asPath.split("/").includes("trade"),
    },
    // {
    //   name: "Messages",
    //   href: "/messages",
    //   icon: ChatIcon,
    //   current: router.asPath.split("/").includes("messages"),
    // },
    // {
    //   name: "History",
    //   href: "/history",
    //   icon: ClockIcon,
    //   current: router.asPath.split("/").includes("history"),
    // },
    {
      name: "Inventory",
      href: "/inventory",
      icon: InboxStackIcon,
      current: router.asPath.split("/").includes("inventory"),
    },
  ];

  return (
    <main id="root" className="w-full min-h-screen bg-firefly">
      <div>
        <MetaTags
          title="Pegasus"
          description="P2P trading platform for Stargaze NFTs"
          image="https://raw.githubusercontent.com/public-awesome/staking-ui/stargaze/public/TwitterCard.png"
          ogImage="https://raw.githubusercontent.com/public-awesome/staking-ui/stargaze/public/OGImage1200x630.png"
          url="https://www.stargaze.zone"
        />
        <Navigation navigation={navigation} />
        <div className="px-8 lg:ml-64">{children}</div>
      </div>
    </main>
  );
}
