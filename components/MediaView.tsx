import { Media } from "util/type";
import { classNames } from "util/css";

export default function MediaView({
  nft,
  onClick,
  selected,
  small,
}: {
  nft: Media;
  onClick: () => void;
  selected: boolean;
  small?: boolean;
}) {
  return (
    <a
      onClick={onClick}
      className={classNames(
        selected ? "ring ring-primary" : "hover:shadow-sm hover:bg-firefly-800",
        "px-5 py-4 border rounded-lg border-white/10 cursor-pointer grow-0 shrink-0"
      )}
    >
      <img src={nft.image} className={"rounded-md aspect-1"} />
      <div className="mt-2.5">
        <p
          className={classNames(
            small ? "text-sm font-medium" : "text-lg font-semibold leading-snug"
          )}
        >
          {nft.name}
        </p>
        <p
          className={classNames(
            small ? "text-xs" : "text-base",
            "text-white/75"
          )}
        >
          {nft.collection.name}
        </p>
      </div>
    </a>
  );
}

export function VerticalMediaView({ nft, href }: { nft: Media; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-row px-5 py-4 space-x-4 border rounded-lg cursor-pointer hover:shadow-sm hover:bg-firefly-800 border-white/10"
    >
      <img src={nft.image} className="rounded-md w-14 h-14" />
      <div>
        <p className="text-base font-semibold text-white">{nft.name}</p>
        <p className="text-sm text-white/75">{nft.collection.name}</p>
      </div>
    </a>
  );
}
