import { EthereumClient, w3mConnectors, w3mProvider } from '@web3modal/ethereum'
import { configureChains } from '@wagmi/core'
import { createConfig } from 'wagmi'
import { mainnet, bsc } from '@wagmi/core/chains'
import { publicProvider } from '@wagmi/core/providers/public'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask'

const projectId = 'fae8eb553c1b729c5374bf2b72ed24e3' // Get this from https://cloud.walletconnect.com

const { chains, publicClient } = configureChains(
  [mainnet, bsc],
  [w3mProvider({ projectId }), publicProvider()]
)

const wagmiClient = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    ...w3mConnectors({ projectId, chains })
  ],
  publicClient
})

const ethereumClient = new EthereumClient(wagmiClient, chains)

export { wagmiClient, ethereumClient, projectId } 
