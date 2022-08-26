import { Header } from "components";
import { useCallback, useState } from "react";
import { useWallet } from "client";
import copy from "copy-to-clipboard";
import { useRouter } from "next/router";

const Trade = () => {
  const { wallet } = useWallet();

  const [nfts, setNfts] = useState<any[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [copiedTradeUrl, setCopiedTradeUrl] = useState<boolean>(false);

  const copyTradeUrl = useCallback(() => {
    if (wallet) {
      console.log(
        process.env.NEXT_PUBLIC_BASE_URL! + "?peer=" + wallet?.address
      );
      copy(process.env.NEXT_PUBLIC_BASE_URL! + "?peer=" + wallet?.address);
      setCopiedTradeUrl(true);
      setTimeout(() => setCopiedTradeUrl(false), 2000);
    }
  }, [wallet, setCopiedTradeUrl]);

  return (
    <main>
      <div className="flex flex-col space-y-4 lg:items-center lg:space-y-0 lg:flex-row lg:justify-between">
        <Header>Trade</Header>
        <button
          onClick={copyTradeUrl}
          className="inline-flex items-center justify-center w-48 h-10 text-xs font-medium text-white border border-white rounded-lg hover:bg-primary hover:border-none"
        >
          {copiedTradeUrl ? "Copied!" : "Copy Trade URL"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <p className="text-lg font-medium text-white">Your NFTs</p>
        </div>
        <div>
          <p className="text-lg font-medium text-white">Their NFTs</p>
        </div>
      </div>
    </main>
  );
};

export default Trade;
