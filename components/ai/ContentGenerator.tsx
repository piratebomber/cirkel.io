'use client';

import { useState } from 'react';
import { useAIStore } from '@/store/ai';

export default function ContentGenerator() {
  const { 
    generateContent, 
    translateContent, 
    generateHashtags, 
    generateCaption, 
    generateScript,
    optimizeContent,
    isProcessing 
  } = useAIStore();
  
  const [activeTab, setActiveTab] = useState('generate');
  const [contentType, setContentType] = useState('caption');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [parameters, setParameters] = useState({
    temperature: 0.7,
    maxTokens: 150,
    tone: 'casual',
    style: 'engaging'
  });
  const [translationData, setTranslationData] = useState({
    text: '',
    targetLanguage: 'es',
    context: ''
  });
  const [imageUrl, setImageUrl] = useState('');
  const [scriptData, setScriptData] = useState({
    topic: '',
    duration: 60,
    style: 'educational'
  });

  const handleGenerateContent = async () => {
    const result = await generateContent(contentType, prompt, parameters);
    if (result) {
      setGeneratedContent(result.generatedContent);
    }
  };

  const handleTranslate = async () => {
    await translateContent(
      translationData.text, 
      translationData.targetLanguage, 
      translationData.context
    );
  };

  const handleGenerateHashtags = async () => {
    const hashtags = await generateHashtags(prompt);
    setGeneratedContent(hashtags.join(' '));
  };

  const handleGenerateCaption = async () => {
    const caption = await generateCaption(imageUrl, parameters.style);
    setGeneratedContent(caption);
  };

  const handleGenerateScript = async () => {
    const script = await generateScript(
      scriptData.topic, 
      scriptData.duration, 
      scriptData.style
    );
    setGeneratedContent(script);
  };

  const handleOptimizeContent = async (platform: string) => {
    const optimized = await optimizeContent(generatedContent, platform);
    if (optimized) {
      setGeneratedContent(optimized.optimizedContent);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">AI Content Generator</h1>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'generate', label: 'Generate' },
          { id: 'translate', label: 'Translate' },
          { id: 'hashtags', label: 'Hashtags' },
          { id: 'caption', label: 'Caption' },
          { id: 'script', label: 'Script' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-6">
          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="caption">Caption</option>
                  <option value="hashtags">Hashtags</option>
                  <option value="description">Description</option>
                  <option value="title">Title</option>
                  <option value="script">Script</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full p-3 border rounded-lg h-32"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tone</label>
                  <select
                    value={parameters.tone}
                    onChange={(e) => setParameters({...parameters, tone: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="casual">Casual</option>
                    <option value="professional">Professional</option>
                    <option value="funny">Funny</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="educational">Educational</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Style</label>
                  <select
                    value={parameters.style}
                    onChange={(e) => setParameters({...parameters, style: e.target.value})}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="engaging">Engaging</option>
                    <option value="informative">Informative</option>
                    <option value="creative">Creative</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="storytelling">Storytelling</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Creativity: {parameters.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={parameters.temperature}
                  onChange={(e) => setParameters({...parameters, temperature: Number(e.target.value)})}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          )}

          {activeTab === 'translate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Text to Translate</label>
                <textarea
                  value={translationData.text}
                  onChange={(e) => setTranslationData({...translationData, text: e.target.value})}
                  placeholder="Enter text to translate..."
                  className="w-full p-3 border rounded-lg h-32"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Language</label>
                <select
                  value={translationData.targetLanguage}
                  onChange={(e) => setTranslationData({...translationData, targetLanguage: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                  <option value="ar">Arabic</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Context (Optional)</label>
                <input
                  type="text"
                  value={translationData.context}
                  onChange={(e) => setTranslationData({...translationData, context: e.target.value})}
                  placeholder="e.g., social media, business, casual..."
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <button
                onClick={handleTranslate}
                disabled={isProcessing}
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Translating...' : 'Translate'}
              </button>
            </div>
          )}

          {activeTab === 'hashtags' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Content Description</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your content to generate relevant hashtags..."
                  className="w-full p-3 border rounded-lg h-32"
                />
              </div>

              <button
                onClick={handleGenerateHashtags}
                disabled={isProcessing}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isProcessing ? 'Generating...' : 'Generate Hashtags'}
              </button>
            </div>
          )}

          {activeTab === 'caption' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL..."
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              {imageUrl && (
                <div>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Caption Style</label>
                <select
                  value={parameters.style}
                  onChange={(e) => setParameters({...parameters, style: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="engaging">Engaging</option>
                  <option value="descriptive">Descriptive</option>
                  <option value="funny">Funny</option>
                  <option value="inspirational">Inspirational</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>

              <button
                onClick={handleGenerateCaption}
                disabled={isProcessing}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isProcessing ? 'Generating...' : 'Generate Caption'}
              </button>
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Topic</label>
                <input
                  type="text"
                  value={scriptData.topic}
                  onChange={(e) => setScriptData({...scriptData, topic: e.target.value})}
                  placeholder="Enter video topic..."
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={scriptData.duration}
                  onChange={(e) => setScriptData({...scriptData, duration: Number(e.target.value)})}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Script Style</label>
                <select
                  value={scriptData.style}
                  onChange={(e) => setScriptData({...scriptData, style: e.target.value})}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="educational">Educational</option>
                  <option value="entertaining">entertaining</option>
                  <option value="promotional">Promotional</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="storytelling">Storytelling</option>
                </select>
              </div>

              <button
                onClick={handleGenerateScript}
                disabled={isProcessing}
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? 'Generating...' : 'Generate Script'}
              </button>
            </div>
          )}
        </div>

        {/* Output Panel */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generated Content</h3>
              {generatedContent && (
                <button
                  onClick={() => navigator.clipboard.writeText(generatedContent)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Copy
                </button>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
              {generatedContent ? (
                <p className="whitespace-pre-wrap">{generatedContent}</p>
              ) : (
                <p className="text-gray-500 italic">Generated content will appear here...</p>
              )}
            </div>
          </div>

          {generatedContent && (
            <div>
              <h4 className="text-md font-medium mb-3">Optimize for Platform</h4>
              <div className="grid grid-cols-2 gap-2">
                {['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok', 'youtube'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => handleOptimizeContent(platform)}
                    className="bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300 capitalize"
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          )}

          {generatedContent && (
            <div>
              <h4 className="text-md font-medium mb-3">Content Analytics</h4>
              <div className="bg-white border rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Character Count:</span>
                  <span className="font-medium">{generatedContent.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Word Count:</span>
                  <span className="font-medium">{generatedContent.split(' ').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reading Time:</span>
                  <span className="font-medium">
                    {Math.ceil(generatedContent.split(' ').length / 200)} min
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}