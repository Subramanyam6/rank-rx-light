'use client';

import { Trophy, TrendingUp, Users, Target, Award, Star } from 'lucide-react';
import { RankingInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RankingDisplayProps {
  ranking: RankingInfo;
}

export default function RankingDisplay({ ranking }: RankingDisplayProps) {
  const { rank, totalCandidates, percentile, score, betterThan } = ranking;

  const getRankBadgeClass = () => {
    if (rank <= 20) return 'bg-green-100 text-green-700 border-green-200';
    if (rank <= 50) return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-neutral-200 text-neutral-700 border-neutral-300';
  };

  const getRankIcon = () => {
    if (rank <= 10) return <Trophy className="h-8 w-8 text-yellow-600" />;
    if (rank <= 50) return <Award className="h-8 w-8 text-blue-600" />;
    if (rank <= 100) return <Star className="h-8 w-8 text-neutral-500" />;
    return <Target className="h-8 w-8 text-neutral-400" />;
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
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-1">Your Ranking</h2>
        <p className="text-muted-foreground">Compared against 200+ synthetic applications</p>
      </div>

      {/* Main Ranking Card */}
      <Card className="text-center bg-white border-neutral-200">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4">
            {getRankIcon()}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-5xl font-bold">#{rank}</div>
              <div className="text-muted-foreground mt-1">out of {totalCandidates} candidates</div>
            </div>

            <Badge className={`text-base px-4 py-1 ${getRankBadgeClass()}`}>
              {getRankTitle()}
            </Badge>

            <div className="text-muted-foreground">
              Top {percentile}% of applicants
            </div>

            <div className="text-sm text-muted-foreground">
              Score: {score.toFixed(4)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-neutral-50 border-neutral-200">
          <CardContent className="pt-6 text-center">
            <div className="p-2 bg-blue-100 rounded-lg inline-block mb-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-3xl font-bold">{betterThan}</div>
            <div className="text-muted-foreground text-sm">Applicants Ranked Below You</div>
            <div className="text-xs text-muted-foreground mt-1">
              Better than {((betterThan / totalCandidates) * 100).toFixed(1)}% of candidates
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-50 border-neutral-200">
          <CardContent className="pt-6 text-center">
            <div className="p-2 bg-green-100 rounded-lg inline-block mb-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-3xl font-bold">{percentile}%</div>
            <div className="text-muted-foreground text-sm">Percentile Ranking</div>
            <div className="text-xs text-muted-foreground mt-1">
              {percentile >= 75 ? 'Excellent' : percentile >= 50 ? 'Good' : 'Needs Improvement'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-50 border-neutral-200">
          <CardContent className="pt-6 text-center">
            <div className="p-2 bg-neutral-200 rounded-lg inline-block mb-3">
              <Target className="h-6 w-6 text-neutral-600" />
            </div>
            <div className="text-3xl font-bold">{totalCandidates - rank + 1}</div>
            <div className="text-muted-foreground text-sm">Applicants Ranked Above You</div>
            <div className="text-xs text-muted-foreground mt-1">
              {rank <= 20 ? 'Highly Competitive' : rank <= 50 ? 'Competitive' : 'Room for Improvement'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="bg-neutral-50 border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 bg-yellow-100 rounded">
              <Star className="h-4 w-4 text-yellow-600" />
            </div>
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ranking Position</span>
                <Badge className={rank <= 50 ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-700'}>
                  {rank <= 25 ? 'Top Quartile' :
                   rank <= 50 ? 'Upper Half' :
                   rank <= 100 ? 'Lower Half' : 'Bottom Quartile'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Competitiveness</span>
                <Badge className={percentile >= 75 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-200 text-neutral-700'}>
                  {percentile >= 90 ? 'Highly Competitive' :
                   percentile >= 75 ? 'Very Competitive' :
                   percentile >= 50 ? 'Moderately Competitive' : 'Less Competitive'}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Score Range</span>
                <span className="font-medium">{score.toFixed(4)} / 1.0000</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Dataset Size</span>
                <span className="font-medium">{totalCandidates} applicants</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="bg-white border-neutral-200">
        <CardHeader>
          <CardTitle className="text-lg">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-green-700">Strengths to Maintain</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Continue strong USMLE performance</li>
                <li>Maintain ECFMG certification</li>
                <li>Focus on visa sponsorship status</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Areas for Improvement</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Target higher USMLE scores if possible</li>
                <li>Minimize examination attempts</li>
                <li>Highlight research/clinical experience</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
