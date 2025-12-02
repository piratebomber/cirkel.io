import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, context } = await request.json();
    
    const translations: { [key: string]: string } = {
      'es': 'Texto traducido al español',
      'fr': 'Texte traduit en français',
      'de': 'Ins Deutsche übersetzter Text',
      'it': 'Testo tradotto in italiano',
      'pt': 'Texto traduzido para português',
      'ja': '日本語に翻訳されたテキスト',
      'ko': '한국어로 번역된 텍스트',
      'zh': '翻译成中文的文本',
      'ar': 'النص المترجم إلى العربية',
      'hi': 'हिंदी में अनुवादित पाठ'
    };

    const translation = {
      id: `translation-${Date.now()}`,
      sourceText: text,
      targetLanguage,
      translatedText: translations[targetLanguage] || `Translated: ${text}`,
      confidence: 0.95,
      model: 'gpt-4',
      context,
      formality: 'formal',
      createdAt: new Date()
    };

    return NextResponse.json(translation);
  } catch (error) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}