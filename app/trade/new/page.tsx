'use client'

import { useChain } from '@cosmos-kit/react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { useStargazeClient } from 'client'
import { getInventory, NFT } from 'client/query'
import { LogoSpinner, MediaView } from 'components'
import { useTx } from 'contexts/tx'
import { coin, Coin, toUtf8 } from 'cosmwasm'
import useToaster, { ToastTypes } from 'hooks/useToaster'
import { useRouter, useSearchParams } from 'next/navigation'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { TradeMessageComposer } from 'types/Trade.message-composer'
import { TokenMsg } from 'types/Trade.types'
import { classNames } from 'util/css'
import { getNftMod, Mod } from 'util/type'
import { MsgExecuteContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx'

interface Expiry {
  name: string
  value: number
  cost: number
}

const expiries: Expiry[] = [
  {
    name: '24 hours',
    value: 1,
    cost: 0,
  },
  {
    name: '48 hours',
    value: 2,
    cost: 10_000_000,
  },
  {
    name: '3 days',
    value: 3,
    cost: 25_000_000,
  },
  {
    name: '5 days',
    value: 5,
    cost: 50_000_000,
  },
  {
    name: '1 week',
    value: 7,
    cost: 100_000_000,
  },
]

export default function Trade() {
  const router = useRouter()

  const { address, isWalletConnected, wallet } = useChain(
    process.env.NEXT_PUBLIC_NETWORK!,
  )

  const params = useSearchParams()
  const peer = params.get('peer')
  const nftsParam = params.get('nfts')

  const [nfts, setNfts] = useState<NFT[]>()
  const [tokens, setTokens] = useState<Coin[]>()
  const [selectedCollection, setSelectedCollection] = useState<string>()

  useEffect(() => {
    async function effect() {
      if (address && isWalletConnected) {
        setSelectedCollection(undefined)
        getInventory(address).then((inventory) => setNfts(inventory))
      }
    }
    effect()
  }, [address, isWalletConnected])

  const selectedSenderNfts = useMemo(() => new Map<Mod, NFT>(), [address])
  const [
    selectedSenderNftsRefreshCounter,
    setSelectedSenderNftsRefreshCounter,
  ] = useState<number>(0)
  const refreshSelectedSenderNfts = useCallback(
    () =>
      setSelectedSenderNftsRefreshCounter(selectedSenderNftsRefreshCounter + 1),
    [selectedSenderNftsRefreshCounter, setSelectedSenderNftsRefreshCounter],
  )

  const [selectedExpiry, setSelectedExpiry] = useState<Expiry>(expiries[0])

  const { client } = useStargazeClient()
  const { tx } = useTx()
  const toaster = useToaster()

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
        ? media.filter((nft) => !selectedSenderNfts.has(getNftMod(nft)))
        : undefined
    },
    [nfts],
  )

  const handleSendOffer = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (selectedSenderNfts.size < 1) return
      if (!client?.tradeContract || !address) return

      if (parseInt(client.wallet.balance?.amount!) < selectedExpiry.cost) {
        return toaster.toast({
          title: 'Insufficient funds to pay for prolonged offer expiry',
          type: ToastTypes.Error,
          dismissable: true,
        })
      }

      const wantedNfts: TokenMsg[] = (nftsParam?.split(',') || []).map(
        (nft) => {
          const [contractAddress, tokenId] = nft.split('-')
          return {
            collection: contractAddress,
            token_id: parseInt(tokenId),
          }
        },
      )

      const offeredNfts: TokenMsg[] = Array.from(
        selectedSenderNfts.values(),
      ).map((nft) => {
        return {
          collection: nft.collection.contractAddress,
          token_id: parseInt(nft.tokenId),
        }
      })

      let date = new Date()
      date.setDate(date.getDate() + selectedExpiry.value)
      let padding = 0
      switch (selectedExpiry.value) {
        case 1:
          padding = 10 * 60 * 1_000_000 // +10 minutes (clock drift on chain can be higher)
          break
        case 7:
          padding = 10 * 60 * 1_000_000 * -1 // -10 minutes (clock drift on chain can be higher)
          break
      }

      let expiresAt = (date.getTime() * 1_000_000 + padding).toString()

      const msgs = []

      const messageComposer = new TradeMessageComposer(
        address,
        client?.tradeContract,
      )
      msgs.push(
        messageComposer.createOffer({
          peer: peer!,
          offeredNfts,
          wantedNfts,
          expiresAt,
          offeredBalances: [],
        }),
      )

      // If there is a cost for the selected expiry time, send the fee to the fee address
      if (selectedExpiry.cost > 0)
        msgs.push({
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value: MsgSend.fromPartial({
            fromAddress: address,
            toAddress: process.env.NEXT_PUBLIC_FEE_ADDRESS!,
            amount: [
              coin(selectedExpiry.cost, process.env.NEXT_PUBLIC_STAKING_DENOM!),
            ],
          }),
        })

      router.prefetch('/trade')

      tx(
        [
          ...offeredNfts.map((nft) => {
            return {
              typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
              value: MsgExecuteContract.fromPartial({
                sender: address,
                msg: toUtf8(
                  JSON.stringify({
                    approve: {
                      spender: client?.tradeContract,
                      token_id: String(nft.token_id),
                    },
                  }),
                ),
                contract: String(nft.collection),
              }),
            }
          }),
          ...msgs,
        ],
        {
          toast: {
            title: 'Offer Sent',
            message: 'Your offer has been sent.',
            type: ToastTypes.Success,
            actions: <></>,
          },
        },
        () => {
          router.push('/trade')
        },
      )
    },
    [
      selectedSenderNfts,
      selectedExpiry,
      client?.tradeContract,
      wallet,
      address,
    ],
  )

  return (
    <main className="flex flex-col w-full space-y-2 md:min-h-[80vh]">
      <div className="w-full p-3 border rounded-md border-white/25 md:min-h-[84vh]">
        <p className="text-xl font-semibold text-white">Select NFTs to offer</p>
        <p className="text-white/50">
          Select up to 5 NFTs and any native or IBC token to offer.
        </p>
        {!nfts ? (
          <div className="md:min-h-[70vh] flex justify-center items-center">
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
                  selectedSenderNfts.has(getNftMod(nft)),
                ) || []),
                ...(nftsByCollection(selectedCollection) || []),
              ].map((nft) => (
                <MediaView
                  key={getNftMod(nft)}
                  nft={nft}
                  onClick={() => {
                    switch (selectedSenderNfts.has(getNftMod(nft))) {
                      case true:
                        selectedSenderNfts.delete(getNftMod(nft))
                        break
                      case false:
                        if (selectedSenderNfts.size >= 5)
                          return toaster.toast({
                            title: 'Cannot select more than 5 NFTs',
                            type: ToastTypes.Error,
                            dismissable: true,
                          })
                        selectedSenderNfts.set(getNftMod(nft), nft)
                        break
                    }
                    refreshSelectedSenderNfts()
                  }}
                  selected={selectedSenderNfts.has(getNftMod(nft))}
                  small
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="w-full p-3 border rounded-md border-white/25 bg-bg-light">
        <p className="pt-1 font-semibold text-white md:pl-2">
          Select an expiry time
        </p>
        <form className="flex flex-col mt-2 space-y-2 md:flex-row md:items-center md:justify-between md:space-x-2 md:space-y-0">
          <Listbox value={selectedExpiry} onChange={setSelectedExpiry}>
            {({ open }) => (
              <>
                <Listbox.Label className="sr-only">
                  Select an expiry time
                </Listbox.Label>
                <div className="relative mt-1">
                  <Listbox.Button className="relative w-full py-2 pl-3 pr-10 text-left border rounded-md shadow-sm cursor-pointer md:w-56 bg-bg border-white/25 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500 sm:text-sm">
                    <span className="inline-flex w-full truncate">
                      <span className="truncate">{selectedExpiry.name}</span>
                      <span className="ml-2 text-gray-500 truncate">
                        {selectedExpiry.cost / 1_000_000} STARS
                      </span>
                    </span>
                    <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                      <ChevronUpDownIcon
                        className="w-5 h-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>

                  <Transition
                    show={open}
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute bottom-0 z-10 w-full py-1 mt-1 overflow-auto text-base border rounded-md shadow-lg bg-bg border-white/25 max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                      {expiries.map((expiry) => (
                        <Listbox.Option
                          key={expiry.name}
                          className={({ active }) =>
                            classNames(
                              active && 'bg-pink-600',
                              'relative text-white cursor-pointer select-none py-2 pl-3 pr-9',
                            )
                          }
                          value={expiry}
                        >
                          {({ selected, active }) => (
                            <>
                              <div className="flex">
                                <span
                                  className={classNames(
                                    selected ? 'font-semibold' : 'font-normal',
                                    'truncate',
                                  )}
                                >
                                  {expiry.name}
                                </span>
                                <span
                                  className={classNames(
                                    active ? 'text-pink-200' : 'text-gray-500',
                                    'ml-2 truncate',
                                  )}
                                >
                                  {expiry.cost / 1_000_000} STARS
                                </span>
                              </div>

                              {selected ? (
                                <span
                                  className={classNames(
                                    active ? 'text-white' : 'text-pink-600',
                                    'absolute inset-y-0 right-0 flex items-center pr-4',
                                  )}
                                >
                                  <CheckIcon
                                    className="w-5 h-5"
                                    aria-hidden="true"
                                  />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </>
            )}
          </Listbox>
          <button
            onClick={handleSendOffer}
            disabled={selectedSenderNfts.size < 1}
            className={classNames(
              selectedSenderNfts.size < 1
                ? 'disabled cursor-not-allowed bg-bg-lightest/75 text-white/50'
                : 'bg-pink-500 hover:bg-pink-600 text-white',
              'inline-flex w-full md:w-48 justify-center px-4 py-2 text-sm font-medium text-center border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 focus:ring-offset-bg-light',
            )}
          >
            Send offer
          </button>
        </form>
      </div>
    </main>
  )
}
