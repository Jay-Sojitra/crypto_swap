# Crypto Swap Interface

A simple crypto swap interface built with Next.js and ethers.js that allows users to swap tokens between Ethereum and Binance Smart Chain networks.

## Features

- Chain selection between Ethereum and BSC
- Token swap interface with input/output fields
- Support for multiple wallets (MetaMask, WalletConnect, Coinbase, Glow)
- Real-time token balance fetching
- KyberSwap API integration for swap execution
- Error handling and loading states

## Prerequisites

- Node.js 18.x or later
- npm or yarn
- A Web3 wallet (MetaMask, WalletConnect, etc.)

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd crypto-swap
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your WalletConnect Project ID:
```
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Select the desired chain (Ethereum or BSC)
3. Choose the tokens you want to swap
4. Enter the amount
5. Click "Swap" to execute the transaction

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- ethers.js
- wagmi
- Web3Modal
- KyberSwap API

## Security Notes

- Never share your private keys or seed phrases
- Always verify transaction details before confirming
- Make sure you're on the correct network before swapping

## License

MIT 
