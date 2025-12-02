import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json()
    const hashtags = generateHashtags(content)
    
    return NextResponse.json({ hashtags })
  } catch (error) {
    return NextResponse.json({ error: 'Hashtag generation failed' }, { status: 500 })
  }
}

function generateHashtags(content: string): string[] {
  const keywords = extractKeywords(content)
  const hashtags = keywords.map(keyword => keyword.toLowerCase().replace(/\s+/g, ''))
  
  // Add trending hashtags based on content
  const trendingHashtags = getTrendingHashtags(content)
  
  return [...new Set([...hashtags, ...trendingHashtags])].slice(0, 5)
}

function extractKeywords(text: string): string[] {
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
  
  const wordFreq: Record<string, number> = {}
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  })
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

function getTrendingHashtags(content: string): string[] {
  const categories = {
    tech: ['technology', 'ai', 'programming', 'code', 'software', 'app', 'digital'],
    sports: ['football', 'basketball', 'soccer', 'game', 'team', 'player', 'match'],
    music: ['music', 'song', 'album', 'artist', 'concert', 'band', 'sound'],
    food: ['food', 'recipe', 'cooking', 'restaurant', 'meal', 'delicious', 'taste'],
    travel: ['travel', 'vacation', 'trip', 'adventure', 'explore', 'journey', 'destination']
  }
  
  const contentLower = content.toLowerCase()
  const suggestedHashtags: string[] = []
  
  Object.entries(categories).forEach(([category, keywords]) => {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      suggestedHashtags.push(category)
    }
  })
  
  return suggestedHashtags
}