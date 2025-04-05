export const MUMBAI_CONFIG = {
  chainId: '0x13881', // 80001 in decimal
  chainName: 'Mumbai Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18
  },
  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
  blockExplorerUrls: ['https://mumbai.polygonscan.com/']
};

export const DELIVERY_CONTRACT_ADDRESS = ''; // You'll get this after deploying the contract

// Function to add Mumbai network to MetaMask
export async function addMumbaiNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [MUMBAI_CONFIG]
    });
    return true;
  } catch (error) {
    console.error('Failed to add Mumbai network:', error);
    return false;
  }
}

// Function to get free test MATIC
export function getFaucetLink() {
  return 'https://faucet.polygon.technology/';
} 