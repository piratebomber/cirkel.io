import { create } from 'zustand';
import { NFT, Wallet, TokenGatedCommunity, Transaction } from '@/types/web3';

interface Web3State {
  wallet: Wallet | null;
  nfts: NFT[];
  transactions: Transaction[];
  tokenGatedCommunities: TokenGatedCommunity[];
  isConnecting: boolean;
  
  // Actions
  connectWallet: (type: string) => Promise<void>;
  disconnectWallet: () => void;
  mintNFT: (nftData: Partial<NFT>) => Promise<void>;
  listNFT: (nftId: string, price: number) => Promise<void>;
  buyNFT: (nftId: string) => Promise<void>;
  createAuction: (nftId: string, startPrice: number, duration: number) => Promise<void>;
  placeBid: (auctionId: string, amount: number) => Promise<void>;
  sendTokens: (to: string, amount: number, token: string) => Promise<void>;
  createTokenGatedCommunity: (communityId: string, requirements: any[]) => Promise<void>;
  verifyTokenAccess: (communityId: string) => Promise<boolean>;
  getTransactionHistory: () => Promise<void>;
}

export const useWeb3Store = create<Web3State>((set, get) => ({
  wallet: null,
  nfts: [],
  transactions: [],
  tokenGatedCommunities: [],
  isConnecting: false,

  connectWallet: async (type) => {
    set({ isConnecting: true });
    try {
      const response = await fetch('/api/web3/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      });
      const wallet = await response.json();
      set({ wallet, isConnecting: false });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      set({ isConnecting: false });
    }
  },

  disconnectWallet: () => {
    set({ wallet: null, nfts: [], transactions: [] });
  },

  mintNFT: async (nftData) => {
    try {
      const response = await fetch('/api/web3/nft/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nftData)
      });
      const nft = await response.json();
      set(state => ({ nfts: [...state.nfts, nft] }));
    } catch (error) {
      console.error('Failed to mint NFT:', error);
    }
  },

  listNFT: async (nftId, price) => {
    try {
      await fetch(`/api/web3/nft/${nftId}/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price })
      });
      set(state => ({
        nfts: state.nfts.map(nft => 
          nft.id === nftId ? { ...nft, isListed: true, listingPrice: price } : nft
        )
      }));
    } catch (error) {
      console.error('Failed to list NFT:', error);
    }
  },

  buyNFT: async (nftId) => {
    try {
      const response = await fetch(`/api/web3/nft/${nftId}/buy`, {
        method: 'POST'
      });
      const transaction = await response.json();
      set(state => ({
        transactions: [...state.transactions, transaction]
      }));
    } catch (error) {
      console.error('Failed to buy NFT:', error);
    }
  },

  createAuction: async (nftId, startPrice, duration) => {
    try {
      await fetch(`/api/web3/nft/${nftId}/auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startPrice, duration })
      });
    } catch (error) {
      console.error('Failed to create auction:', error);
    }
  },

  placeBid: async (auctionId, amount) => {
    try {
      await fetch(`/api/web3/auction/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
    } catch (error) {
      console.error('Failed to place bid:', error);
    }
  },

  sendTokens: async (to, amount, token) => {
    try {
      const response = await fetch('/api/web3/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, amount, token })
      });
      const transaction = await response.json();
      set(state => ({
        transactions: [...state.transactions, transaction]
      }));
    } catch (error) {
      console.error('Failed to send tokens:', error);
    }
  },

  createTokenGatedCommunity: async (communityId, requirements) => {
    try {
      const response = await fetch('/api/web3/token-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId, requirements })
      });
      const tokenGatedCommunity = await response.json();
      set(state => ({
        tokenGatedCommunities: [...state.tokenGatedCommunities, tokenGatedCommunity]
      }));
    } catch (error) {
      console.error('Failed to create token-gated community:', error);
    }
  },

  verifyTokenAccess: async (communityId) => {
    try {
      const response = await fetch(`/api/web3/verify-access/${communityId}`);
      const { hasAccess } = await response.json();
      return hasAccess;
    } catch (error) {
      console.error('Failed to verify token access:', error);
      return false;
    }
  },

  getTransactionHistory: async () => {
    try {
      const response = await fetch('/api/web3/transactions');
      const transactions = await response.json();
      set({ transactions });
    } catch (error) {
      console.error('Failed to get transaction history:', error);
    }
  }
}));