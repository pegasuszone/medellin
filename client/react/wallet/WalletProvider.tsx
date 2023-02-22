import type { SignerOptions } from '@cosmos-kit/core'
import { GasPrice, SigningCosmWasmClientOptions } from 'cosmwasm'
import { WalletProvider as WalletContextProvider } from './WalletContext'
import StargazeProvider from 'client/react/client/StargazeProvider'
import { ChainProvider } from '@cosmos-kit/react'
import { chains, assets } from 'chain-registry'

import { wallets as KeplrWallet } from '@cosmos-kit/keplr'
import { wallets as CosmostationWallet } from '@cosmos-kit/cosmostation'
import { wallets as LeapWallet } from '@cosmos-kit/leap'
import { wallets as OmniWallet } from '@cosmos-kit/omni'

const signerOptions: SignerOptions = {
  signingCosmwasm: ({
    chain_name,
  }): SigningCosmWasmClientOptions | undefined => {
    let gasTokenName: string | undefined
    switch (chain_name) {
      case 'stargaze':
      case 'stargazetestnet':
        gasTokenName = 'ustargaze'
        break
    }
    // @ts-ignore messed up dependencies
    return gasTokenName
      ? { gasPrice: GasPrice.fromString(`0.0025${gasTokenName}`) }
      : undefined
  },
}

export default function WalletProvider({
  children,
}: {
  children: JSX.Element
}) {
  return (
    <ChainProvider
      signerOptions={signerOptions}
      chains={chains}
      assetLists={assets}
      wallets={[
        ...KeplrWallet,
        ...CosmostationWallet,
        ...OmniWallet,
        ...LeapWallet,
      ]}
      defaultNameService="stargaze"
    >
      <WalletContextProvider>
        <StargazeProvider>{children}</StargazeProvider>
      </WalletContextProvider>
    </ChainProvider>
  )
}
