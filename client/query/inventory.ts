import { gql } from '@apollo/client'
import { client, NFT } from '.'

export const getInventory = async (address: string) => {
  const { data } = await client.query({
    query: gql`
      query Inventory($owner: String) {
        tokens(owner: $owner) {
          tokens {
            tokenId
            name
            collection {
              name
              contractAddress
            }
            media {
              image(size: LG) {
                jpgLink
              }
            }
          }
        }
      }
    `,
    variables: { owner: address },
  })

  return data.tokens.tokens as NFT[]
}

export const getToken = async (collectionAddr: string, tokenId: string) => {
  console.log(collectionAddr, tokenId)
  const { data } = await client.query({
    query: gql`
      query Token($collectionAddr: String!, $tokenId: String!) {
        token(collectionAddr: $collectionAddr, tokenId: $tokenId) {
          tokenId
          name
          collection {
            name
            contractAddress
          }
          media {
            image(size: LG) {
              jpgLink
            }
          }
        }
      }
    `,
    variables: { collectionAddr, tokenId },
  })

  return data.token as NFT
}
