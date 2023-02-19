import { classNames } from 'util/css'
import { NFT } from 'client/query'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'
import { isIOS } from 'react-device-detect'

type MintImageProps = {
  src?: string
  inactive?: boolean
  alt?: string
}

function MediaPlayerLoading() {
  return (
    <div
      className={
        'w-full h-full bg-neutral-900 z-10 rounded-lg flex justify-center items-center animate-pulse'
      }
      style={{
        aspectRatio: '1',
      }}
    />
  )
}

function ImageError() {
  return (
    <div className="flex flex-col items-center justify-center w-full text-sm opacity-50 aspect-1 bg-neutral-900 rounded-xl text-neutral-400">
      <div className="mt-4">Error loading image.</div>
    </div>
  )
}

function StaticImage({
  src,
  inactive,
  alt,
  onLoad,
}: MintImageProps & {
  onLoad?: () => void
}) {
  const [nextImgError, setNextImgError] = useState(false)
  const [loading, setLoading] = useState(true)
  const imageClassName = classNames(
    !inactive ? 'opacity-90' : 'opacity-100',
    'object-cover rounded-lg w-full transition-none',
  )

  function handleOnLoad() {
    onLoad?.()
    setLoading(false)
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute z-10 w-full h-full">
          <MediaPlayerLoading />
        </div>
      )}
      <Image
        key={src}
        className={imageClassName}
        src={src as string}
        alt={alt as string}
        height={256}
        width={256}
        onError={() => setNextImgError(true)}
        onLoadingComplete={handleOnLoad}
      />
    </div>
  )
}

function AnimatedImage({ src, inactive, alt }: MintImageProps) {
  const [loading, setLoading] = useState(true)
  const { ref, inView } = useInView({
    /* Optional options */
    threshold: 0.5,
  })

  const videoRef = useRef<
    HTMLVideoElement | undefined
  >() as React.MutableRefObject<HTMLVideoElement>

  // Play video when in view.
  useEffect(() => {
    if (inView && !isIOS) {
      videoRef.current?.play()
      setLoading(false)
    } else {
      videoRef.current?.pause()
    }
  }, [inView])

  return (
    <div ref={ref}>
      {loading && <MediaPlayerLoading />}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        onLoad={() => setLoading(false)}
      >
        {/* Disable WebM b/c of pixelated GIF results. */}
        {/* <source type="video/webm" src={data.webmLink} /> */}
        <source type="video/mp4" src={src} />
        <StaticImage
          src={src}
          inactive={inactive}
          alt={alt}
          onLoad={() => setLoading(false)}
        />
      </video>
    </div>
  )
}

function RenderMintImage({ src = '', inactive = false, alt }: MintImageProps) {
  const extension = src.split('.').pop()
  const isAnimated =
    extension === 'gif' ||
    extension === 'mp4' ||
    extension === 'webm' ||
    extension === 'mov' ||
    extension === 'm4v'

  if (isAnimated) {
    return <AnimatedImage src={src} inactive={inactive} alt={alt} />
  } else {
    return <StaticImage src={src} inactive={inactive} alt={alt} />
  }
}

export function MintImage(props: MintImageProps) {
  const { ref, inView } = useInView()

  const [load, setLoad] = useState(false)

  useEffect(() => {
    if (inView) {
      setLoad(true)
    }
  }, [inView])

  return (
    <div ref={ref}>
      {load ? <RenderMintImage {...props} /> : <MediaPlayerLoading />}
    </div>
  )
}

export default function MediaView({
  nft,
  onClick,
  selected,
  small,
}: {
  nft: NFT
  onClick: () => void
  selected: boolean
  small?: boolean
}) {
  return (
    <a
      onClick={onClick}
      className={classNames(
        selected
          ? 'ring ring-pink-500'
          : 'hover:shadow-sm hover:bg-firefly-800',
        'px-5 py-4 border rounded-lg border-white/10 cursor-pointer grow-0 shrink-0',
      )}
    >
      {/* <img src={nft.media.image.jpgLink} className={'rounded-md aspect-1'} /> */}
      <MintImage src={nft.media.image.jpgLink} alt={nft.name} />
      <div className="mt-2.5">
        <p
          className={classNames(
            small
              ? 'text-sm font-medium'
              : 'text-lg font-semibold leading-snug',
          )}
        >
          {nft.name}
        </p>
        <p
          className={classNames(
            small ? 'text-xs' : 'text-base',
            'text-white/75',
          )}
        >
          {nft.collection.name}
        </p>
      </div>
    </a>
  )
}

export function VerticalMediaView({ nft, href }: { nft: NFT; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex flex-row px-5 py-4 space-x-4 border rounded-lg cursor-pointer hover:shadow-sm hover:bg-white/10 border-white/10"
    >
      {/* <img src={nft.media.image.jpgLink} className="rounded-md w-14 h-14" /> */}
      <div className="w-14 h-14">
        <MintImage src={nft.media.image.jpgLink} alt={nft.name} />
      </div>
      <div>
        <p className="text-base font-semibold text-white">{nft.name}</p>
        <p className="text-sm text-white/75">{nft.collection.name}</p>
      </div>
    </a>
  )
}
