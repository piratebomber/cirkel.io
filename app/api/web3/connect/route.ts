import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json();
    
    const wallet = {
      id: `wallet-${Date.now()}`,
      userId: 'current-user',
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      type,
      blockchain: type === 'phantom' ? 'solana' : 'ethereum',
      balance: [
        {
          token: type === 'phantom' ? 'SOL' : 'ETH',
          symbol: type === 'phantom' ? 'SOL' : 'ETH',
          balance: Math.random() * 10,
          usdValue: Math.random() * 30000,
          decimals: 18
        }
      ],
      nfts: [],
      transactions: [],
      isConnected: true,
      isVerified: true,
      createdAt: new Date()
    };

    return NextResponse.json(wallet);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect wallet' }, { status: 500 });
  }
}