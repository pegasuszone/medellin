import React, { FunctionComponent, useState, useCallback } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/20/solid";
import copyToClipboard from "copy-to-clipboard";
import { classNames } from "util/css";
import { truncateAddress } from "util/type";
import { useWallet } from "client";

interface AddressComponentType {
  address: string;
  copy?: boolean;
  truncate?: boolean;
}

const AddressComponent: FunctionComponent<AddressComponentType> = ({
  address,
  copy,
  truncate = true,
}) => {
  const [copied, setCopied] = useState(false);

  const { wallet } = useWallet();

  const displayAddress =
    truncate && address ? truncateAddress(address, 8, 4) : address;

  const handleCopy = useCallback(() => {
    copyToClipboard(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 4000);
  }, [address]);

  const cachedClassNames = classNames(
    "group",
    "text-white",
    address === wallet?.address && "font-bold",
    copy && "cursor-pointer"
  );

  return (
    <span className={cachedClassNames}>
      {copy ? (
        <span onClick={handleCopy}>{displayAddress}</span>
      ) : address === wallet?.address ? (
        "You"
      ) : (
        displayAddress
      )}{" "}
      {copy && (
        <span
          className="inline opacity-0 group-hover:opacity-25"
          onClick={handleCopy}
        >
          {copied ? (
            <CheckIcon className="inline w-4 h-4 -mt-0.5" />
          ) : (
            <>
              <ClipboardIcon className="inline w-4 h-4 -mt-0.5" />
            </>
          )}
        </span>
      )}
    </span>
  );
};

export default AddressComponent;
