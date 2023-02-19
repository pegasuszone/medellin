// @ts-ignore
import dJSON from 'dirty-json'
import { getToken, NFT } from 'client/query'
import type { Token } from 'types/Trade.types'

export async function fetchNfts(tokens: Token[]): Promise<NFT[] | null> {
  let data
  try {
    data = tokens.map((nft) => {
      return getToken(nft.collection, nft.token_id.toString()).then((data) => {
        return data
      })
    })
  } catch (e) {
    console.error(e)
    return null
  }

  const nfts = await Promise.all(data)
  return nfts
}

export async function fetchTokenUriInfo(tokenUri: string) {
  // Some artists have a double slash, so we need to clean it
  // https://stackoverflow.com/questions/40649382/how-to-replace-double-multiple-slash-to-single-in-url
  tokenUri = tokenUri.replace(/(https?:\/\/)|(\/)+/g, '$1$2')

  let response
  try {
    response = await fetch(tokenUri)
  } catch (e) {
    // Some artists forget to remove the file extension
    response = await fetch(`${tokenUri}.json`)
  }

  if (!response.ok) throw Error('Failed to fetch URI')
  const textNftInfo = await response.text()
  let nftInfo
  try {
    nftInfo = JSON.parse(textNftInfo)
  } catch (e) {
    nftInfo = dJSON.parse(textNftInfo)
  }

  // Replace IPFS links for browsers that don't support them
  nftInfo.image = getImageUri(nftInfo.image)

  return nftInfo
}

export function normalizeIpfsUri(ipfsUri: string) {
  return ipfsUri.replace(
    /ipfs:\/\//i,
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  )
}

export function getImageUri(ipfsUri: string, queryArgs: string = '') {
  return `${normalizeIpfsUri(ipfsUri)}${queryArgs}`
}

export function getNFTLink({
  marketplaceLink,
  contract,
  tokenId,
}: {
  marketplaceLink?: boolean
  contract: string
  tokenId: string | number
}) {
  const baseUrl = process.env.NEXT_PUBLIC_STARGAZE_BASE_URL!
  const linkBase = marketplaceLink ? '/marketplace/' : '/media/'
  const link = `${baseUrl}/${linkBase}${contract}/${encodeURIComponent(
    tokenId,
  )}`
  return link
}
