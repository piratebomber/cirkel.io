'use client';

import { useState, useEffect } from 'react';
import { useGamingStore } from '@/store/gaming';

export default function GameCenter() {
  const {
    games,
    achievements,
    leaderboards,
    rewards,
    currentGame,
    playerStats,
    inventory,
    createGame,
    startGame,
    endGame,
    joinMultiplayerGame,
    unlockAchievement,
    updateLeaderboard,
    earnReward,
    tradeReward,
    getPlayerStats
  } = useGamingStore();

  const [activeTab, setActiveTab] = useState('games');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gameData, setGameData] = useState({
    name: '',
    type: 'puzzle' as 'puzzle' | 'arcade' | 'trivia' | 'social' | 'strategy',
    description: '',
    maxPlayers: 1,
    duration: 300
  });
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    getPlayerStats();
  }, []);

  const handleCreateGame = async () => {
    await createGame({
      ...gameData,
      thumbnail: '/game-placeholder.png',
      gameUrl: '/games/' + gameData.name.toLowerCase().replace(/\s+/g, '-'),
      rewards: [],
      leaderboard: [],
      isMultiplayer: gameData.maxPlayers > 1,
      category: gameData.type,
      rating: 0,
      playCount: 0,
      createdBy: 'current-user'
    });
    setShowCreateModal(false);
    setGameData({
      name: '',
      type: 'puzzle',
      description: '',
      maxPlayers: 1,
      duration: 300
    });
  };

  const handleStartGame = async (gameId: string) => {
    await startGame(gameId);
    setSelectedGame(gameId);
  };

  const handleEndGame = async (score: number) => {
    if (currentGame) {
      await endGame(currentGame.id, score);
      await updateLeaderboard('global', score);
      setSelectedGame(null);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'engagement': return '💬';
      case 'content': return '📝';
      case 'social': return '👥';
      case 'gaming': return '🎮';
      case 'milestone': return '🏆';
      default: return '⭐';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'bronze': return 'text-orange-600 bg-orange-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'diamond': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Game Center</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Game
          </button>
          {playerStats && (
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg">
              <span className="font-semibold">Level {playerStats.level || 1}</span>
              <span className="ml-2">{playerStats.totalPoints || 0} pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Player Stats Overview */}
      {playerStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Games Played</p>
                <p className="text-3xl font-bold text-blue-600">{playerStats.gamesPlayed || 0}</p>
              </div>
              <div className="text-4xl">🎮</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Achievements</p>
                <p className="text-3xl font-bold text-green-600">{playerStats.achievementsUnlocked || 0}</p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">High Score</p>
                <p className="text-3xl font-bold text-purple-600">{playerStats.highScore || 0}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Rewards</p>
                <p className="text-3xl font-bold text-orange-600">{inventory.length}</p>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'games', label: 'Games' },
          { id: 'achievements', label: 'Achievements' },
          { id: 'leaderboards', label: 'Leaderboards' },
          { id: 'rewards', label: 'Rewards' }
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

      {/* Content Area */}
      {activeTab === 'games' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <img
                src={game.thumbnail}
                alt={game.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">{game.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{game.description}</p>
                
                <div className="flex justify-between items-center mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    game.type === 'puzzle' ? 'bg-blue-100 text-blue-800' :
                    game.type === 'arcade' ? 'bg-red-100 text-red-800' :
                    game.type === 'trivia' ? 'bg-green-100 text-green-800' :
                    game.type === 'social' ? 'bg-purple-100 text-purple-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {game.type}
                  </span>
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm ml-1">{game.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>{game.isMultiplayer ? `Up to ${game.maxPlayers} players` : 'Single player'}</span>
                  <span>{Math.round(game.duration / 60)} min</span>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  Played {game.playCount.toLocaleString()} times
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStartGame(game.id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                  >
                    Play Now
                  </button>
                  {game.isMultiplayer && (
                    <button
                      onClick={() => joinMultiplayerGame(game.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                    >
                      Join Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-4">{getAchievementIcon(achievement.type)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{achievement.name}</h3>
                  <p className="text-gray-600 text-sm">{achievement.description}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                  {achievement.rarity}
                </span>
                <span className="text-sm text-gray-500">
                  {achievement.unlockedBy.length} unlocked
                </span>
              </div>

              <div className="text-sm text-gray-600 mb-4">
                <strong>Criteria:</strong> {achievement.criteria.metric} {achievement.criteria.operator} {achievement.criteria.value}
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700">Reward:</div>
                <div className="text-sm text-gray-600">
                  {achievement.reward.type}: {achievement.reward.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'leaderboards' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaderboards.map((leaderboard) => (
            <div key={leaderboard.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{leaderboard.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  leaderboard.period === 'daily' ? 'bg-green-100 text-green-800' :
                  leaderboard.period === 'weekly' ? 'bg-blue-100 text-blue-800' :
                  leaderboard.period === 'monthly' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {leaderboard.period}
                </span>
              </div>

              <div className="space-y-3">
                {leaderboard.entries.slice(0, 10).map((entry, index) => (
                  <div key={entry.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium">User {entry.userId.slice(0, 8)}</div>
                        <div className="text-xs text-gray-500">
                          {entry.change > 0 ? '↗️' : entry.change < 0 ? '↘️' : '➡️'} {Math.abs(entry.change)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{entry.score.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">🔥 {entry.streak}</div>
                    </div>
                  </div>
                ))}
              </div>

              {leaderboard.rewards.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-medium text-gray-700 mb-2">Rewards:</div>
                  <div className="space-y-1">
                    {leaderboard.rewards.slice(0, 3).map((reward) => (
                      <div key={reward.rank} className="flex justify-between text-xs">
                        <span>#{reward.rank}</span>
                        <span>{reward.type}: {reward.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {inventory.map((reward) => (
            <div key={reward.id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="text-center mb-4">
                <img
                  src={reward.image}
                  alt={reward.name}
                  className="w-16 h-16 mx-auto mb-2 rounded"
                />
                <h3 className="font-semibold">{reward.name}</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="capitalize">{reward.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rarity:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getRarityColor(reward.rarity)}`}>
                    {reward.rarity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tradeable:</span>
                  <span>{reward.tradeable ? '✅' : '❌'}</span>
                </div>
              </div>

              {reward.tradeable && (
                <button
                  onClick={() => tradeReward(reward.id, 'other-user')}
                  className="w-full mt-4 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                >
                  Trade
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Game Modal */}
      {selectedGame && currentGame && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl h-3/4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{currentGame.name}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEndGame(Math.floor(Math.random() * 1000))}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Finish Game
                </button>
                <button
                  onClick={() => setSelectedGame(null)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Exit
                </button>
              </div>
            </div>
            
            <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-xl font-semibold mb-2">Game: {currentGame.name}</p>
                <p className="text-gray-600">Game would be embedded here</p>
                <div className="mt-4">
                  <div className="text-2xl font-bold">Score: {Math.floor(Math.random() * 1000)}</div>
                  <div className="text-sm text-gray-500">Time: {Math.floor(Math.random() * 300)}s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Game Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Game</h2>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Game Name"
                value={gameData.name}
                onChange={(e) => setGameData({...gameData, name: e.target.value})}
                className="w-full p-3 border rounded-lg"
              />
              <textarea
                placeholder="Description"
                value={gameData.description}
                onChange={(e) => setGameData({...gameData, description: e.target.value})}
                className="w-full p-3 border rounded-lg h-24"
              />
              <select
                value={gameData.type}
                onChange={(e) => setGameData({...gameData, type: e.target.value as any})}
                className="w-full p-3 border rounded-lg"
              >
                <option value="puzzle">Puzzle</option>
                <option value="arcade">Arcade</option>
                <option value="trivia">Trivia</option>
                <option value="social">Social</option>
                <option value="strategy">Strategy</option>
              </select>
              <input
                type="number"
                placeholder="Max Players"
                value={gameData.maxPlayers}
                onChange={(e) => setGameData({...gameData, maxPlayers: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="number"
                placeholder="Duration (seconds)"
                value={gameData.duration}
                onChange={(e) => setGameData({...gameData, duration: Number(e.target.value)})}
                className="w-full p-3 border rounded-lg"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGame}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                Create Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}