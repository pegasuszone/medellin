import { ApolloClient, InMemoryCache } from '@apollo/client'

export const client = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_API!,
  cache: new InMemoryCache(),
})

export { getInventory, getToken } from './inventory'

export interface NFT {
  name: string
  tokenId: string
  collection: {
    name: string
    contractAddress: string
  }
  media: {
    image: {
      jpgLink: string
    }
  }
}
