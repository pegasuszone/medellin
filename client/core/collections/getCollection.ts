import type { CosmWasmClient } from '@cosmjs/cosmwasm-stargate/build/cosmwasmclient'
import type { CollectionInfoResponse } from '@stargazezone/types/contracts/sg721'
import { normalizeIpfsUri } from 'util/nft' // TODO: this is too specific to NextJS.
import { Collection, NumTokensResponse, SG721InfoResponse } from './types'

async function _getCollectionInfo(
  contract: string,
  client?: CosmWasmClient,
): Promise<CollectionInfoResponse> {
  if (!client) {
    throw new Error('No CosmWasm client provided.')
  }

  try {
    const collectionInfo = await client.queryContractSmart(contract, {
      collection_info: {},
    })
    collectionInfo.image = normalizeIpfsUri(collectionInfo.image)
    return collectionInfo
  } catch (e) {
    console.error(e)

    throw new Error(`Error fetching collection info for: ${contract}`)
  }
}

async function _getContractInfo(
  contract: string,
  client?: CosmWasmClient,
): Promise<SG721InfoResponse> {
  if (!client) {
    throw new Error('No CosmWasm client provided.')
  }
  let sg721Info = await client.queryContractSmart(contract, {
    contract_info: {},
  })

  return sg721Info
}

async function _getNumTokens(
  contract: string,
  client?: CosmWasmClient,
): Promise<NumTokensResponse> {
  if (!client) {
    throw new Error('No CosmWasm client provided.')
  }
  let sg721Info = await client.queryContractSmart(contract, {
    num_tokens: {},
  })

  return sg721Info
}

type Args = {
  address: string
  client: CosmWasmClient
}

export default async function getCollection({
  address,
  client,
}: Args): Promise<Collection> {
  if (!client) {
    throw new Error('No CosmWasm client provided.')
  }

  const collectionInfo = await _getCollectionInfo(address, client)
  const sg721Info = await _getContractInfo(address, client)
  const numTokens = await _getNumTokens(address, client)

  return {
    contractAddress: address,
    ...collectionInfo,
    ...sg721Info,
    numTokens: numTokens.count,
  }
}
