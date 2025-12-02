import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js';
import { Web3Storage } from 'web3.storage';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{ trait_type: string; value: string | number }>;
  creator: string;
  royalty_percentage: number;
}

export interface NFTListing {
  id: string;
  tokenId: string;
  contractAddress: string;
  price: string;
  currency: 'ETH' | 'MATIC' | 'SOL';
  seller: string;
  metadata: NFTMetadata;
  status: 'active' | 'sold' | 'cancelled';
  createdAt: string;
}

export class NFTMarketplace {
  private supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
  private web3Storage = new Web3Storage({ token: process.env.WEB3_STORAGE_TOKEN! });
  private provider: ethers.providers.JsonRpcProvider;
  private marketplaceContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    this.marketplaceContract = new ethers.Contract(
      process.env.MARKETPLACE_CONTRACT_ADDRESS!,
      this.getMarketplaceABI(),
      this.provider
    );
  }

  async createNFT(
    creatorId: string,
    contentUrl: string,
    metadata: Omit<NFTMetadata, 'image'>,
    walletAddress: string
  ): Promise<string> {
    try {
      // Upload content to IPFS
      const contentFile = await fetch(contentUrl).then(r => r.blob());
      const contentCID = await this.web3Storage.put([new File([contentFile], 'content')]);
      
      // Create metadata with IPFS image URL
      const fullMetadata: NFTMetadata = {
        ...metadata,
        image: `https://${contentCID}.ipfs.w3s.link/content`
      };

      // Upload metadata to IPFS
      const metadataBlob = new Blob([JSON.stringify(fullMetadata)], { type: 'application/json' });
      const metadataCID = await this.web3Storage.put([new File([metadataBlob], 'metadata.json')]);
      const tokenURI = `https://${metadataCID}.ipfs.w3s.link/metadata.json`;

      // Store in database
      const { data: nft } = await this.supabase
        .from('nfts')
        .insert({
          creator_id: creatorId,
          metadata: fullMetadata,
          token_uri: tokenURI,
          wallet_address: walletAddress,
          status: 'minting',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return nft.id;
    } catch (error) {
      console.error('NFT creation failed:', error);
      throw error;
    }
  }

  async mintNFT(nftId: string, signer: ethers.Signer): Promise<string> {
    try {
      const { data: nft } = await this.supabase
        .from('nfts')
        .select('*')
        .eq('id', nftId)
        .single();

      if (!nft) throw new Error('NFT not found');

      const contract = this.marketplaceContract.connect(signer);
      const tx = await contract.mintNFT(nft.wallet_address, nft.token_uri);
      const receipt = await tx.wait();

      const tokenId = receipt.events?.find((e: any) => e.event === 'Transfer')?.args?.tokenId?.toString();

      await this.supabase
        .from('nfts')
        .update({
          token_id: tokenId,
          transaction_hash: tx.hash,
          status: 'minted'
        })
        .eq('id', nftId);

      return tokenId;
    } catch (error) {
      console.error('NFT minting failed:', error);
      throw error;
    }
  }

  async listNFT(
    tokenId: string,
    price: string,
    currency: 'ETH' | 'MATIC' | 'SOL',
    sellerId: string,
    signer: ethers.Signer
  ): Promise<string> {
    try {
      const priceInWei = ethers.utils.parseEther(price);
      const contract = this.marketplaceContract.connect(signer);
      
      const tx = await contract.listItem(tokenId, priceInWei);
      await tx.wait();

      const { data: listing } = await this.supabase
        .from('nft_listings')
        .insert({
          token_id: tokenId,
          price,
          currency,
          seller_id: sellerId,
          status: 'active',
          transaction_hash: tx.hash,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      return listing.id;
    } catch (error) {
      console.error('NFT listing failed:', error);
      throw error;
    }
  }

  async buyNFT(listingId: string, buyerId: string, signer: ethers.Signer): Promise<string> {
    try {
      const { data: listing } = await this.supabase
        .from('nft_listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'active')
        .single();

      if (!listing) throw new Error('Listing not found or not active');

      const contract = this.marketplaceContract.connect(signer);
      const priceInWei = ethers.utils.parseEther(listing.price);
      
      const tx = await contract.buyItem(listing.token_id, { value: priceInWei });
      await tx.wait();

      await Promise.all([
        this.supabase
          .from('nft_listings')
          .update({ status: 'sold', buyer_id: buyerId })
          .eq('id', listingId),
        
        this.supabase
          .from('nft_transactions')
          .insert({
            listing_id: listingId,
            buyer_id: buyerId,
            seller_id: listing.seller_id,
            price: listing.price,
            currency: listing.currency,
            transaction_hash: tx.hash,
            created_at: new Date().toISOString()
          })
      ]);

      return tx.hash;
    } catch (error) {
      console.error('NFT purchase failed:', error);
      throw error;
    }
  }

  async getMarketplaceListings(filters: {
    category?: string;
    priceRange?: { min: number; max: number };
    creator?: string;
    sortBy?: 'price' | 'created_at' | 'popularity';
    limit?: number;
    offset?: number;
  } = {}): Promise<NFTListing[]> {
    let query = this.supabase
      .from('nft_listings')
      .select(`
        *,
        nfts(*),
        users!seller_id(username, display_name, avatar_url)
      `)
      .eq('status', 'active');

    if (filters.creator) {
      query = query.eq('nfts.creator_id', filters.creator);
    }

    if (filters.priceRange) {
      query = query
        .gte('price', filters.priceRange.min.toString())
        .lte('price', filters.priceRange.max.toString());
    }

    switch (filters.sortBy) {
      case 'price':
        query = query.order('price', { ascending: true });
        break;
      case 'popularity':
        query = query.order('view_count', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    }

    const { data } = await query;
    return data || [];
  }

  async getUserNFTs(userId: string): Promise<any[]> {
    const { data } = await this.supabase
      .from('nfts')
      .select(`
        *,
        nft_listings(*)
      `)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    return data || [];
  }

  async createCollection(
    creatorId: string,
    name: string,
    description: string,
    coverImage: string,
    royaltyPercentage: number
  ): Promise<string> {
    const { data: collection } = await this.supabase
      .from('nft_collections')
      .insert({
        creator_id: creatorId,
        name,
        description,
        cover_image: coverImage,
        royalty_percentage: royaltyPercentage,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    return collection.id;
  }

  async getCollections(creatorId?: string): Promise<any[]> {
    let query = this.supabase
      .from('nft_collections')
      .select(`
        *,
        nfts(count),
        users(username, display_name, avatar_url)
      `);

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data } = await query.order('created_at', { ascending: false });
    return data || [];
  }

  private getMarketplaceABI(): any[] {
    return [
      "function mintNFT(address to, string memory tokenURI) public returns (uint256)",
      "function listItem(uint256 tokenId, uint256 price) public",
      "function buyItem(uint256 tokenId) public payable",
      "function cancelListing(uint256 tokenId) public",
      "function updatePrice(uint256 tokenId, uint256 newPrice) public",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      "event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
      "event ItemSold(uint256 indexed tokenId, address indexed buyer, uint256 price)"
    ];
  }
}

export const nftMarketplace = new NFTMarketplace();