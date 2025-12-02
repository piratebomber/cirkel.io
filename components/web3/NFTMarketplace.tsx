'use client';

import { useState, useEffect } from 'react';
import { useWeb3Store } from '@/store/web3';
import { NFT } from '@/types/web3';

export default function NFTMarketplace() {
  const { nfts, wallet, mintNFT, listNFT, buyNFT, createAuction, placeBid } = useWeb3Store();
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showMintModal, setShowMintModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [mintData, setMintData] = useState({
    name: '',
    description: '',
    image: '',
    price: 0,
    royalty: 10
  });
  const [listPrice, setListPrice] = useState(0);
  const [auctionData, setAuctionData] = useState({
    startPrice: 0,
    duration: 24
  });
  const [bidAmount, setBidAmount] = useState(0);

  const handleMintNFT = async () => {
    await mintNFT({
      ...mintData,
      creator: wallet?.userId || '',
      owner: wallet?.userId || '',
      blockchain: 'ethereum',
      currency: 'ETH',
      isListed: false,
      attributes: [],
      metadata: {
        standard: 'ERC-721',
        ipfsHash: '',
        fileSize: 0,
        format: 'image/png',
        properties: {}
      },
      rarity: 'common'
    });
    setShowMintModal(false);
    setMintData({ name: '', description: '', image: '', price: 0, royalty: 10 });
  };

  const handleListNFT = async () => {
    if (selectedNFT) {
      await listNFT(selectedNFT.id, listPrice);
      setShowListModal(false);
      setListPrice(0);
    }
  };

  const handleCreateAuction = async () => {
    if (selectedNFT) {
      await createAuction(selectedNFT.id, auctionData.startPrice, auctionData.duration);
      setShowAuctionModal(false);
      setAuctionData({ startPrice: 0, duration: 24 });
    }
  };

  const handleBuyNFT = async (nftId: string) => {
    await buyNFT(nftId);
  };

  const handlePlaceBid = async (auctionId: string) => {
    await placeBid(auctionId, bidAmount);
    setBidAmount(0);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">NFT Marketplace</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowMintModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Mint NFT
          </button>
          {wallet && (
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-600">Balance: </span>
              <span className="font-semibold">
                {wallet.balance.find(b => b.symbol === 'ETH')?.balance || 0} ETH
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((nft) => (
          <div key={nft.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-64 object-cover"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">{nft.name}</h3>
              <p className="text-gray-600 text-sm mb-3">{nft.description}</p>
              
              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  nft.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-800' :
                  nft.rarity === 'epic' ? 'bg-purple-100 text-purple-800' :
                  nft.rarity === 'rare' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {nft.rarity}
                </span>
                <span className="text-sm text-gray-500">#{nft.tokenId}</span>
              </div>

              {nft.isListed && (
                <div className="mb-3">
                  <div className="text-lg font-bold text-green-600">
                    {nft.listingPrice} {nft.currency}
                  </div>
                </div>
              )}

              {nft.auction && (
                <div className="mb-3 p-3 bg-red-50 rounded">
                  <div className="text-sm text-red-600 font-medium">Live Auction</div>
                  <div className="text-lg font-bold">{nft.auction.currentBid} {nft.currency}</div>
                  <div className="text-xs text-gray-500">
                    Ends: {new Date(nft.auction.endTime).toLocaleDateString()}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {nft.owner === wallet?.userId ? (
                  <>
                    <button
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowListModal(true);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                    >
                      List
                    </button>
                    <button
                      onClick={() => {
                        setSelectedNFT(nft);
                        setShowAuctionModal(true);
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700"
                    >
                      Auction
                    </button>
                  </>
                ) : (
                  <>
                    {nft.isListed && (
                      <button
                        onClick={() => handleBuyNFT(nft.id)}
                        className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                      >
                        Buy Now
                      </button>
                    )}
                    {nft.auction && (
                      <button
                        onClick={() => handlePlaceBid(nft.auction!.id)}
                        className="flex-1 bg-red-600 text-white py-2 px-3 rounded text-sm hover:bg-red-700"
                      >
                        Bid
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mint NFT Modal */}
      {showMintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Mint New NFT</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="NFT Name"
                value={mintData.name}
                onChange={(e) => setMintData({...mintData, name: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={mintData.description}
                onChange={(e) => setMintData({...mintData, description: e.target.value})}
                className="w-full p-3 border rounded-lg h-24"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={mintData.image}
                onChange={(e) => setMintData({...mintData, image: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Price (ETH)"
                value={mintData.price}
                onChange={(e) => setMintData({...mintData, price: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Royalty %"
                value={mintData.royalty}
                onChange={(e) => setMintData({...mintData, royalty: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMintModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleMintNFT}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Mint NFT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List NFT Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">List NFT for Sale</h2>
            <input
              type="number"
              placeholder="Price (ETH)"
              value={listPrice}
              onChange={(e) => setListPrice(Number(e.target.value))}
              className="w-full p-3 border rounded-lg mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowListModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleListNFT}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                List NFT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auction Modal */}
      {showAuctionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Auction</h2>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Starting Price (ETH)"
                value={auctionData.startPrice}
                onChange={(e) => setAuctionData({...auctionData, startPrice: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Duration (hours)"
                value={auctionData.duration}
                onChange={(e) => setAuctionData({...auctionData, duration: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAuctionModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAuction}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg"
              >
                Create Auction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}