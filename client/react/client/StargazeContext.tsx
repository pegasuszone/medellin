import React from 'react'
import { StargazeClient } from 'client/core'

const StargazeClientContext = React.createContext<{
  client: StargazeClient | null
}>({
  client: null,
})
export default StargazeClientContext
