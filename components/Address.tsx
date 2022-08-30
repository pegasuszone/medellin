import { useWallet } from "client";

export const AddressClassName = "text-white font-medium text-base";

export default function Address({
  address,
  className = AddressClassName,
}: {
  address: string;
  className?: string;
}) {
  const { wallet } = useWallet();
  const isSelf = address === wallet?.address;
  return <p className={className}>{isSelf ? "You" : address}</p>;
}
