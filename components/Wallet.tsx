import { SyntheticEvent, useCallback } from "react";

import copy from "copy-to-clipboard";
import { useWallet } from "client";
import { useState } from "react";
import { microAmountMultiplier } from "util/constants";

import {
  ArrowRightOnRectangleIcon as LogoutIcon,
  CheckIcon,
  ClipboardIcon as CopyIcon,
} from "@heroicons/react/24/outline";

const Action = ({
  icon,
  action,
}: {
  icon: React.ReactElement<any, any>;
  action: (e?: SyntheticEvent<Element | Event, Event>) => void;
}) => (
  <a
    onClick={action}
    className="cursor-pointer w-7 h-7 rounded p-1.5 text-white hover:bg-firefly-700"
  >
    {icon}
  </a>
);

export default function Wallet() {
  const [copied, setCopied] = useState<boolean>(false);

  const { wallet, connect, disconnect } = useWallet();

  const handleCopy = useCallback(
    (e: SyntheticEvent<Element | Event, Event> | undefined) => {
      if (!wallet) return;

      e?.preventDefault();

      copy(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    },
    [wallet]
  );

  return wallet ? (
    <div className="flex flex-row items-center justify-between px-4 py-3 mx-3 mt-3 text-white transition duration-150 ease-in-out border cursor-pointer border-black/10 hover:border-black/50 hover:dark:border-white/50 dark:border-white/10 lg:rounded-lg">
      <div>
        <p className="w-32 text-xs font-medium truncate">{wallet.name}</p>
        <p className="text-xs font-light">
          {new Intl.NumberFormat(`en-US`, {
            style: "currency",
            currency: "USD",
          })
            .format(
              parseFloat(wallet.balance?.amount || "0") / microAmountMultiplier
            )
            .replace("$", "")}{" "}
          STARS
        </p>
      </div>

      <div className="flex flex-row space-x-2">
        <Action
          icon={copied ? <CheckIcon /> : <CopyIcon />}
          action={handleCopy}
        />
        <Action icon={<LogoutIcon />} action={disconnect} />
      </div>
    </div>
  ) : (
    <button
      onClick={connect}
      className="inline-flex items-center justify-center py-4 mx-4 mt-4 text-sm font-medium text-white rounded-lg bg-primary"
    >
      Connect
    </button>
  );
}
