import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    const sentiment = analyzeSentiment(text)
    
    return NextResponse.json({
      sentiment: sentiment.label,
      confidence: sentiment.confidence,
      emotions: sentiment.emotions
    })
  } catch (error) {
    return NextResponse.json({ error: 'Sentiment analysis failed' }, { status: 500 })
  }
}

function analyzeSentiment(text: string) {
  const positiveWords = ['good', 'great', 'awesome', 'amazing', 'love', 'excellent', 'fantastic', 'wonderful', 'happy', 'joy']
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disgusting', 'sad', 'angry', 'disappointed', 'frustrated']
  
  const words = text.toLowerCase().split(/\W+/)
  let positiveScore = 0
  let negativeScore = 0
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++
    if (negativeWords.includes(word)) negativeScore++
  })
  
  const totalScore = positiveScore - negativeScore
  const confidence = Math.min((Math.abs(totalScore) / words.length) * 10, 1)
  
  let label = 'neutral'
  if (totalScore > 0) label = 'positive'
  if (totalScore < 0) label = 'negative'
  
  return {
    label,
    confidence,
    emotions: {
      joy: positiveScore / words.length,
      anger: negativeScore / words.length,
      neutral: 1 - confidence
    }
  }
}