'use client';

import { useState, useRef, useEffect } from 'react';
import { useARStore } from '@/store/ar';

export default function ARStudio() {
  const {
    filters,
    experiences,
    avatars,
    currentFilter,
    currentAvatar,
    isARActive,
    createFilter,
    applyFilter,
    removeFilter,
    createExperience,
    createAvatar,
    customizeAvatar
  } = useARStore();

  const [activeTab, setActiveTab] = useState('filters');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterData, setFilterData] = useState({
    name: '',
    description: '',
    type: 'face' as 'face' | 'world' | 'hand' | 'body',
    category: 'beauty'
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isARActive && videoRef.current) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(console.error);
    }
  }, [isARActive]);

  const handleCreateFilter = async () => {
    await createFilter({
      ...filterData,
      effects: [{
        id: '1',
        type: 'mesh',
        properties: {
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          color: '#ffffff',
          opacity: 1
        }
      }],
      assets: [],
      creator: 'current-user',
      usageCount: 0,
      rating: 0,
      isPublic: true
    });
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">AR Studio</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Create New
        </button>
      </div>

      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'filters', label: 'AR Filters' },
          { id: 'experiences', label: 'AR Experiences' },
          { id: 'avatars', label: '3D Avatars' },
          { id: 'preview', label: 'Live Preview' }
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'filters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filters.map((filter) => (
                <div key={filter.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <img
                    src={filter.thumbnail}
                    alt={filter.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{filter.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{filter.description}</p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        filter.type === 'face' ? 'bg-pink-100 text-pink-800' :
                        filter.type === 'world' ? 'bg-green-100 text-green-800' :
                        filter.type === 'hand' ? 'bg-blue-100 text-blue-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {filter.type}
                      </span>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm ml-1">{filter.rating.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => applyFilter(filter.id)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                      >
                        Try Filter
                      </button>
                      <button className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-300">
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Live AR Preview</h3>
              
              <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-96 object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                />
                
                {currentFilter && (
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    {currentFilter.name}
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => removeFilter()}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                >
                  Remove Filter
                </button>
                <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Take Photo
                </button>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Record Video
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {currentFilter && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Filter Controls</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="50"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Color</label>
                  <input
                    type="color"
                    defaultValue="#ffffff"
                    className="w-full h-10 rounded border"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Import 3D Model
              </button>
              <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
                Create Animation
              </button>
              <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                Add Particles
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Filter</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Filter Name"
                value={filterData.name}
                onChange={(e) => setFilterData({...filterData, name: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={filterData.description}
                onChange={(e) => setFilterData({...filterData, description: e.target.value})}
                className="w-full p-3 border rounded-lg h-24"
              />
              <select
                value={filterData.type}
                onChange={(e) => setFilterData({...filterData, type: e.target.value as any})}
                className="w-full p-3 border rounded-lg"
              >
                <option value="face">Face Filter</option>
                <option value="world">World Filter</option>
                <option value="hand">Hand Tracking</option>
                <option value="body">Body Tracking</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFilter}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}