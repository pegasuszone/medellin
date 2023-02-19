'use client'

import { useChain } from '@cosmos-kit/react'
import { useStargazeClient } from 'client'
import { getInventory, NFT } from 'client/query'
import { LogoSpinner, MediaView, Spinner } from 'components'
import { fromBech32 } from 'cosmwasm'
import useToaster, { ToastTypes } from 'hooks/useToaster'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { classNames } from 'util/css'
import { getNftMod, Mod } from 'util/type'

export default function Trade() {
  const [peerDataInput, setPeerDataInput] = useState<string>('')
  const [isLoadingPeer, setIsLoadingPeer] = useState<boolean>(false)
  const [peer, setPeer] = useState<string>()

  const { isWalletConnected, address } = useChain(
    process.env.NEXT_PUBLIC_NETWORK!,
  )

  const router = useRouter()
  const peerSearchParam = useSearchParams().get('peer')

  useEffect(() => {
    if (peerSearchParam) {
      setPeerDataInput(peerSearchParam)
      handleSetPeer(
        { preventDefault: () => {} } as React.FormEvent,
        peerSearchParam,
      )
    }
  }, [peerSearchParam])

  const [nfts, setNfts] = useState<NFT[]>()
  const [selectedCollection, setSelectedCollection] = useState<string>()

  const selectedPeerNfts = useMemo(() => new Map<Mod, NFT>(), [peer])
  const [
    selectedPeerNftsRefreshCounter,
    setSelectedPeerNftsRefreshCounter,
  ] = useState<number>(0)
  const refreshSelectedPeerNfts = useCallback(() => {
    setSelectedPeerNftsRefreshCounter(selectedPeerNftsRefreshCounter + 1)
    router.prefetch(
      '/trade/new?peer=' +
        peer +
        '&nfts=' +
        Array.from(selectedPeerNfts.keys()).join(','),
    )
  }, [
    selectedPeerNftsRefreshCounter,
    setSelectedPeerNftsRefreshCounter,
    router,
  ])

  const { client } = useStargazeClient()
  const toaster = useToaster()

  function setPeerError() {
    toaster.toast({
      title: 'Invalid peer address/name',
      type: ToastTypes.Error,
      dismissable: true,
    })
  }

  function addressError() {
    toaster.toast({
      title: 'You cannot trade with yourself',
      type: ToastTypes.Error,
      dismissable: true,
    })
  }

  const handleSetPeer = useCallback(
    async (e: React.FormEvent, peer?: string) => {
      e.preventDefault()
      if (!isWalletConnected || !address)
        return toaster.toast({
          title: 'Connect a wallet to initiate a trade',
          type: ToastTypes.Error,
          dismissable: true,
        })
      const peerString = peer || peerDataInput
      if (!peerString) return setPeerError()
      if (peerString === address) return addressError()
      setIsLoadingPeer(true)
      try {
        fromBech32(peerString)
        setIsLoadingPeer(false)
        if (!peer) router.push('/trade?peer=' + peerDataInput)
        return setPeer(peerString)
      } catch {
        try {
          if (!client?.cosmWasmClient) await client?.connect()
          const data = await client?.cosmWasmClient.queryContractSmart(
            process.env.NEXT_PUBLIC_NAMES_CONTRACT_ADDRESS!,
            {
              associated_address: {
                name: peerString.replaceAll(
                  /(\.([a-z]{2,24}))(\.([a-z]{2,24}))?/g,
                  '',
                ),
              },
            },
          )
          setIsLoadingPeer(false)
          if (data === address) return addressError()
          router.push('/trade?peer=' + data)
          return setPeer(data)
        } catch (e) {
          setIsLoadingPeer(false)
          return setPeerError()
        }
      }
    },
    [peerDataInput, client, isWalletConnected, address],
  )

  useEffect(() => {
    async function effect() {
      if (peer) {
        setSelectedCollection(undefined)
        getInventory(peer).then((inventory) => setNfts(inventory))
      }
    }
    effect()
  }, [peer])

  const nftCollections = useCallback(() => {
    return [...new Set(nfts?.map((nft) => nft.collection.contractAddress))].map(
      (address) =>
        nfts?.find((nft) => nft.collection.contractAddress === address)
          ?.collection!,
    )
  }, [nfts])

  const nftsByCollection = useCallback(
    (collection: string | undefined) => {
      const media = collection
        ? nfts?.filter((nft) => nft.collection.contractAddress === collection)
        : nfts

      return media
        ? media.filter((nft) => !selectedPeerNfts.has(getNftMod(nft)))
        : undefined
    },
    [nfts],
  )

  return (
    <main className="flex flex-col w-full space-y-2 md:min-h-[80vh]">
      <div className="w-full p-3 border rounded-md border-white/25 bg-bg-light">
        <p className="text-xl font-semibold text-white">
          Who are you trading with?
        </p>
        <p className="text-white/50">
          Enter any Stargaze address or name below to view their NFT collection
          and select items to initiate a trade.
        </p>
        <form
          onSubmit={handleSetPeer}
          className="flex flex-col mt-4 space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0"
        >
          <input
            id="peer"
            type="text"
            placeholder="Enter STARS address or name"
            className="w-full p-2 text-sm text-white rounded-lg focus:border-white/25 border-white/25 bg-bg-light placeholder-white/50 focus:ring-2 focus:ring-white/25 focus:ring-offset-bg-light"
            value={peerDataInput}
            onChange={(e) => setPeerDataInput(e.currentTarget.value)}
          />
          <button
            type="submit"
            className={classNames(
              isLoadingPeer
                ? 'disabled bg-bg-lightest cursor-wait'
                : 'bg-primary-600 hover:bg-primary/75 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:ring-offset-2 focus:ring-offset-bg-light',
              'inline-flex w-full md:w-32 justify-center px-4 py-2 text-sm font-medium text-center text-white border border-transparent rounded-md shadow-sm',
            )}
          >
            {isLoadingPeer ? <Spinner /> : 'Search'}
          </button>
        </form>
      </div>
      {peer && (
        <>
          <div className="w-full p-3 border rounded-md border-white/25 md:min-h-[73vh]">
            <p className="text-xl font-semibold text-white">
              Select NFTs to trade for
            </p>
            <p className="text-white/50">
              Select up to 5 NFTs you would like to receive. You'll be able
              choose which NFTs to send in the next step.
            </p>
            {peer && !nfts ? (
              <div className="md:min-h-[60vh] flex justify-center items-center">
                <LogoSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
                <div>
                  <div className="flex flex-row items-center justify-between pb-2 border-b border-white/10">
                    <p className="text-white">Collections</p>
                    {selectedCollection && (
                      <a
                        onClick={() => setSelectedCollection(undefined)}
                        className="text-sm font-medium text-pink-500 cursor-pointer hover:text-pink-600"
                      >
                        Clear
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col md:max-h-[66vh] overflow-y-scroll space-y-2 mt-1.5">
                    {nftCollections().map((collection) => (
                      <a
                        key={collection.contractAddress}
                        className={classNames(
                          selectedCollection === collection.contractAddress
                            ? 'bg-white/25'
                            : 'hover:bg-white/10',
                          'inline-flex items-center font-medium px-2 py-1.5 cursor-pointer rounded-md',
                        )}
                        onClick={() =>
                          setSelectedCollection(collection.contractAddress)
                        }
                      >
                        {collection.name}
                      </a>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 p-1 col-span-2 md:grid-cols-3 md:max-h-[66vh] overflow-y-scroll gap-2">
                  {[
                    ...(nfts?.filter((nft) =>
                      selectedPeerNfts.has(getNftMod(nft)),
                    ) || []),
                    ...(nftsByCollection(selectedCollection) || []),
                  ].map((nft) => (
                    <MediaView
                      key={getNftMod(nft)}
                      nft={nft}
                      onClick={() => {
                        switch (selectedPeerNfts.has(getNftMod(nft))) {
                          case true:
                            selectedPeerNfts.delete(getNftMod(nft))
                            break
                          case false:
                            if (selectedPeerNfts.size >= 5)
                              return toaster.toast({
                                title: 'Cannot select more than 5 NFTs',
                                type: ToastTypes.Error,
                                dismissable: true,
                              })
                            selectedPeerNfts.set(getNftMod(nft), nft)
                            break
                        }
                        refreshSelectedPeerNfts()
                      }}
                      selected={selectedPeerNfts.has(getNftMod(nft))}
                      small
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="w-full p-3 border rounded-md border-white/25 bg-bg-light">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <p className="pt-1 font-semibold text-white md:pl-2">
                Select up to 5 NFTs to continue
              </p>
              <button
                disabled={selectedPeerNfts.size < 1}
                className={classNames(
                  selectedPeerNfts.size < 1 || isLoadingPeer
                    ? 'disabled cursor-not-allowed bg-bg-lightest/75 text-white/50'
                    : 'bg-pink-500 hover:bg-pink-600 text-white',
                  'inline-flex w-full md:w-48 justify-center px-4 py-2 text-sm font-medium text-center border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-bg-light',
                )}
                onClick={() =>
                  router.push(
                    '/trade/new?peer=' +
                      peer +
                      '&nfts=' +
                      Array.from(selectedPeerNfts.keys()).join(','),
                  )
                }
              >
                Continue
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
