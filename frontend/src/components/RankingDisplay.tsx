'use client';

import { Trophy, TrendingUp, Users, Target, Award, Star } from 'lucide-react';
import { RankingInfo } from '@/types';

interface RankingDisplayProps {
  ranking: RankingInfo;
}

export default function RankingDisplay({ ranking }: RankingDisplayProps) {
  const { rank, totalCandidates, percentile, score, betterThan } = ranking;

  const getRankColor = () => {
    if (rank <= 20) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rank <= 50) return 'text-green-600 bg-green-50 border-green-200';
    if (rank <= 100) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getRankIcon = () => {
    if (rank <= 10) return <Trophy className="h-8 w-8 text-yellow-600" />;
    if (rank <= 50) return <Award className="h-8 w-8 text-green-600" />;
    if (rank <= 100) return <Star className="h-8 w-8 text-blue-600" />;
    return <Target className="h-8 w-8 text-gray-600" />;
  };

  const getRankTitle = () => {
    if (rank <= 10) return 'Top Performer';
    if (rank <= 25) return 'Excellent Candidate';
    if (rank <= 50) return 'Strong Candidate';
    if (rank <= 100) return 'Good Candidate';
    return 'Developing Candidate';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Ranking</h2>
        <p className="text-gray-600">Compared against 200+ synthetic applications</p>
      </div>

      {/* Main Ranking Card */}
      <div className={`border-2 rounded-xl p-8 text-center ${getRankColor()}`}>
        <div className="flex justify-center mb-4">
          {getRankIcon()}
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-6xl font-bold text-gray-900">#{rank}</div>
            <div className="text-lg text-gray-700 mt-1">out of {totalCandidates} candidates</div>
          </div>

          <div className="text-2xl font-semibold text-gray-800">
            {getRankTitle()}
          </div>

          <div className="text-lg text-gray-700">
            Top {percentile}% of applicants
          </div>

          <div className="text-sm text-gray-600">
            Score: {score.toFixed(4)}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">{betterThan}</div>
          <div className="text-gray-600">Applicants Ranked Below You</div>
          <div className="text-sm text-gray-500 mt-1">
            Better than {((betterThan / totalCandidates) * 100).toFixed(1)}% of candidates
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">{percentile}%</div>
          <div className="text-gray-600">Percentile Ranking</div>
          <div className="text-sm text-gray-500 mt-1">
            {percentile >= 75 ? 'Excellent' : percentile >= 50 ? 'Good' : 'Needs Improvement'}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <Target className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-gray-900">{totalCandidates - rank + 1}</div>
          <div className="text-gray-600">Applicants Ranked Above You</div>
          <div className="text-sm text-gray-500 mt-1">
            {rank <= 20 ? 'Highly Competitive' : rank <= 50 ? 'Competitive' : 'Room for Improvement'}
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Star className="h-6 w-6 text-yellow-600 mr-2" />
          Performance Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Ranking Position:</span>
              <span className={`font-semibold ${
                rank <= 25 ? 'text-green-700' :
                rank <= 50 ? 'text-blue-700' :
                rank <= 100 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {rank <= 25 ? 'Top Quartile' :
                 rank <= 50 ? 'Upper Half' :
                 rank <= 100 ? 'Lower Half' : 'Bottom Quartile'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Competitiveness:</span>
              <span className={`font-semibold ${
                percentile >= 90 ? 'text-green-700' :
                percentile >= 75 ? 'text-blue-700' :
                percentile >= 50 ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {percentile >= 90 ? 'Highly Competitive' :
                 percentile >= 75 ? 'Very Competitive' :
                 percentile >= 50 ? 'Moderately Competitive' : 'Less Competitive'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Score Range:</span>
              <span className="font-semibold text-gray-900">
                {score.toFixed(4)} / 1.0000
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-700">Dataset Size:</span>
              <span className="font-semibold text-gray-900">
                {totalCandidates} applicants
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">📈 Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Strengths to Maintain:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Continue strong USMLE performance</li>
              <li>• Maintain ECFMG certification</li>
              <li>• Focus on visa sponsorship status</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Areas for Improvement:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Target higher USMLE scores if possible</li>
              <li>• Minimize examination attempts</li>
              <li>• Highlight research/clinical experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
