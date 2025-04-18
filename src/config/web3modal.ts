import { EthereumClient, w3mProvider } from '@web3modal/ethereum'
import { configureChains, createConfig } from 'wagmi'
import { mainnet, bsc } from '@wagmi/core/chains'
import { publicProvider } from '@wagmi/core/providers/public'
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect'
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet'
import { InjectedConnector } from 'wagmi/connectors/injected'

// Get this from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

if (!projectId) {
  throw new Error('You need to provide NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID env variable')
}

const { chains, publicClient } = configureChains(
  [mainnet, bsc],
  [w3mProvider({ projectId }), publicProvider()]
)

// Custom injected connector that prioritizes MetaMask
const injectedConnector = new InjectedConnector({
  chains,
  options: {
    name: 'MetaMask',
    shimDisconnect: true,
    getProvider: () => 
      typeof window !== 'undefined' && window.ethereum?.isMetaMask ? window.ethereum : undefined
  }
})

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    injectedConnector,
    new CoinbaseWalletConnector({
      chains,
      options: {
        appName: 'Crypto Swap',
        appLogoUrl: 'https://example.com/logo.png' // You can add your app's logo URL here
      }
    }),
    new WalletConnectConnector({
      chains,
      options: {
        projectId,
        showQrModal: true,
        qrModalOptions: { themeMode: "light" }
      }
    })
  ],
  publicClient
})

const ethereumClient = new EthereumClient(wagmiConfig, chains)

export { wagmiConfig as wagmiClient, ethereumClient, projectId } 
