'use client';

import React, { useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

const supportedLanguages = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' }
};

export default function LanguageSwitcher() {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentLangInfo = supportedLanguages[currentLanguage as keyof typeof supportedLanguages];

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      setCurrentLanguage(languageCode);
      localStorage.setItem('preferred-language', languageCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-white transition-colors disabled:opacity-50"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span className="text-sm">
          {currentLangInfo?.flag} {currentLangInfo?.nativeName}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs text-gray-400 px-2 py-1 mb-2 border-b border-gray-700">
                Select Language
              </div>
              {Object.entries(supportedLanguages).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => handleLanguageChange(code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    code === currentLanguage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{info.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{info.nativeName}</div>
                      <div className="text-xs opacity-75">{info.name}</div>
                    </div>
                  </div>
                  {code === currentLanguage && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}