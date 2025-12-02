'use client';

import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [timeframe]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      setMetrics({
        userEngagement: {
          dailyActiveUsers: 1250,
          weeklyActiveUsers: 5400,
          monthlyActiveUsers: 18200,
          sessionDuration: 420,
          bounceRate: 0.25,
          retentionRate: 0.75
        },
        contentMetrics: {
          postsCreated: 340,
          likesGiven: 2100,
          commentsPosted: 890,
          sharesCount: 450,
          topHashtags: [
            { tag: 'tech', count: 120 },
            { tag: 'design', count: 95 },
            { tag: 'startup', count: 78 }
          ]
        },
        revenueMetrics: {
          totalRevenue: 15420,
          subscriptionRevenue: 12000,
          adRevenue: 2800,
          tipRevenue: 620
        }
      });
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const engagementData = {
    labels: ['DAU', 'WAU', 'MAU'],
    datasets: [{
      label: 'Active Users',
      data: [
        metrics.userEngagement.dailyActiveUsers,
        metrics.userEngagement.weeklyActiveUsers,
        metrics.userEngagement.monthlyActiveUsers
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
    }]
  };

  const contentData = {
    labels: ['Posts', 'Likes', 'Comments', 'Shares'],
    datasets: [{
      label: 'Content Activity',
      data: [
        metrics.contentMetrics.postsCreated,
        metrics.contentMetrics.likesGiven,
        metrics.contentMetrics.commentsPosted,
        metrics.contentMetrics.sharesCount
      ],
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2
    }]
  };

  const revenueData = {
    labels: ['Subscriptions', 'Ads', 'Tips'],
    datasets: [{
      data: [
        metrics.revenueMetrics.subscriptionRevenue,
        metrics.revenueMetrics.adRevenue,
        metrics.revenueMetrics.tipRevenue
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
    }]
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          {(['24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-4 py-2 rounded-lg ${
                timeframe === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">User Engagement</h2>
          <Bar data={engagementData} options={{ responsive: true }} />
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Content Activity</h2>
          <Line data={contentData} options={{ responsive: true }} />
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Revenue</h2>
          <Doughnut data={revenueData} options={{ responsive: true }} />
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-white">
              ${metrics.revenueMetrics.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Total Revenue</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Top Hashtags</h2>
          <div className="space-y-3">
            {metrics.contentMetrics.topHashtags.map((hashtag: any, index: number) => (
              <div key={hashtag.tag} className="flex justify-between items-center">
                <span className="text-blue-400">#{hashtag.tag}</span>
                <span className="text-white">{hashtag.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}