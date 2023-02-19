'use client'

import type { Offer } from 'types/Trade.types'
import { useStargazeClient } from 'client'
import { Empty, LogoSpinner } from 'components'
import OfferView from 'components/Offer'
import { useCallback, useEffect, useState } from 'react'
import { useChain } from '@cosmos-kit/react'

export default function TradeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { client } = useStargazeClient()
  const { address, isWalletConnected } = useChain(
    process.env.NEXT_PUBLIC_NETWORK!,
  )

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
        ?.offersBySender({
          sender: address,
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
    <div className="flex flex-col-reverse m-6 space-y-6 md:grid md:gap-6 md:space-y-0 md:md:grid-cols-3">
      <div className="col-span-2 mt-6 md:mt-0">{children}</div>
      <div className="w-full h-full p-3 border rounded-md border-white/25 md:min-h-[96vh]">
        <p className="mb-4 text-xl font-semibold text-white">Sent offers</p>
        {!isWalletConnected && (
          <p className="text-white/50">
            Connect a wallet to access your outbox.
          </p>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center">
            <LogoSpinner />
          </div>
        ) : (
          <>
            {(offers?.length || 0) < 1 ? (
              <div className="flex items-center justify-center h-full">
                <Empty />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {offers?.map((offer) => (
                  <OfferView offer={offer} actionCallback={refresh} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
