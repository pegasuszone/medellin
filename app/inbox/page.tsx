'use client'

import type { Offer } from 'types/Trade.types'
import { useChain } from '@cosmos-kit/react'
import { Empty, LogoSpinner } from 'components'
import OfferView from 'components/Offer'
import { useCallback, useEffect, useState } from 'react'
import { useStargazeClient } from 'client'

export default function Inbox() {
  const { isWalletConnected, address } = useChain(
    process.env.NEXT_PUBLIC_NETWORK!,
  )
  const { client } = useStargazeClient()

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [offers, setOffers] = useState<Offer[]>()

  const [refreshCounter, setRefreshCounter] = useState<number>(0)
  const refresh = useCallback(() => {
    setRefreshCounter(refreshCounter + 1)
  }, [refreshCounter])

  useEffect(() => {
    if (address && client?.tradeClient) {
      setIsLoading(true)
      client?.tradeClient
        ?.offersByPeer({
          peer: address,
        })
        .then((data) => {
          setIsLoading(false)
          setOffers(data?.offers || [])
        })
    } else {
      setIsLoading(false)
      setOffers(undefined)
    }
  }, [client?.tradeClient, address, refreshCounter])

  return (
    <div className="m-6 h-full p-3 border rounded-md border-white/25 md:min-h-[96vh]">
      <p className="text-xl font-semibold text-white">Inbox</p>
      {!isWalletConnected && (
        <p className="text-white/50">Connect a wallet to access your inbox.</p>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center">
          <LogoSpinner />
        </div>
      ) : (
        <>
          {(offers?.length || 0) < 1 ? (
            <div className="flex items-center justify-center h-full md:mt-[35vh]">
              <Empty />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
              {offers?.map((offer) => (
                <OfferView offer={offer} actionCallback={refresh} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
