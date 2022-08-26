import { Media } from "util/types";
import { classNames } from "util/css";

export default function MediaView({
  nft,
  onClick,
  selected,
}: {
  nft: Media;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <a
      onClick={onClick}
      className={classNames(
        selected ? "ring ring-primary" : "hover:shadow-sm hover:bg-firefly-800",
        "px-5 py-4 border rounded-lg border-white/10 cursor-pointer"
      )}
    >
      <img src={nft.image} className="rounded-md" />
      <div className="mt-2.5">
        <p className="text-lg font-semibold text-white">{nft.name}</p>
        <p className="text-white/75">{nft.collection.name}</p>
      </div>
    </a>
  );
}
