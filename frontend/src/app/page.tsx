'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, TrendingUp, Award, Loader2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import ParsedDataDisplay from '@/components/ParsedDataDisplay';
import RankingDisplay from '@/components/RankingDisplay';
import { UploadState, ParsedApplication, RankingInfo } from '@/types';

export default function Home() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isParsing: false,
    error: null,
    parsedData: null,
    ranking: null,
  });

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadState({
      isUploading: true,
      isParsing: false,
      error: null,
      parsedData: null,
      ranking: null,
    });

    try {
      // Upload file to API
      const formData = new FormData();
      formData.append('pdf', file);

      const uploadResponse = await fetch('https://rank-rx-light.vercel.app/api/parse-pdf', {
        method: 'POST',
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload PDF');
      }

      const parsedData: ParsedApplication = await uploadResponse.json();

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isParsing: true,
        parsedData,
      }));

      // Calculate ranking
      const ranking = await calculateRanking(parsedData);

      setUploadState(prev => ({
        ...prev,
        isParsing: false,
        ranking,
      }));

    } catch (error) {
      setUploadState({
        isUploading: false,
        isParsing: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        parsedData: null,
        ranking: null,
      });
    }
  }, []);

  const calculateRanking = async (parsedData: ParsedApplication): Promise<RankingInfo> => {
    try {
      // Load synthetic data
      const response = await fetch('/synthetic_applicants.json');
      const syntheticData: ParsedApplication[] = await response.json();

      // Calculate score for uploaded application
      const uploadedScore = calculateScore(parsedData);

      // Calculate scores for all synthetic applications and add uploaded
      const allScores = syntheticData.map(app => ({
        score: calculateScore(app),
        isUploaded: false,
      }));

      allScores.push({
        score: uploadedScore,
        isUploaded: true,
      });

      // Sort by score (higher is better)
      allScores.sort((a, b) => b.score - a.score);

      // Find position of uploaded application
      const uploadedPosition = allScores.findIndex(app => app.isUploaded) + 1;
      const totalCandidates = allScores.length;
      const percentile = Math.round(((totalCandidates - uploadedPosition) / totalCandidates) * 100);
      const betterThan = totalCandidates - uploadedPosition;

      return {
        rank: uploadedPosition,
        totalCandidates,
        percentile,
        score: uploadedScore,
        betterThan,
      };
    } catch (error) {
      console.error('Error calculating ranking:', error);
      return {
        rank: 0,
        totalCandidates: 200,
        percentile: 0,
        score: 0,
        betterThan: 0,
      };
    }
  };

  const calculateScore = (app: ParsedApplication): number => {
    const s1 = app.usmle.step1;
    const s2 = app.usmle.step2_ck;
    const ecfmg = app.ecfmg_status_report;

    // Calculate scores similar to the Python implementation
    const s1_pass = s1.passed ? 1.0 : 0.0;
    const s2_pass = s2.passed ? 1.0 : 0.0;
    const s2_score = s2.score ? parseFloat(s2.score) : null;
    const s2_comp = s2_score ? Math.max(0.0, Math.min(1.0, (s2_score - 180) / 100)) : s2_pass * 0.7;

    const failures = s1.failures + s2.failures;
    const visa_needed = app.visa.visa_sponsorship_needed === 'Yes' ? 1 : 0;
    const ecfmg_yes = ecfmg.certified === 'Yes' ? 1 : 0;

    const score = (
      0.55 * s2_comp +
      0.25 * s1_pass +
      0.10 * Math.max(0, 1 - Math.min(failures, 3) / 3) +
      0.05 * (1 - visa_needed) +
      0.05 * ecfmg_yes
    );

    return Math.round(score * 10000) / 10000; // Round to 4 decimal places
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RankRx Light</h1>
                <p className="text-sm text-gray-600">USMLE Application Ranking System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">AI-Powered Analysis</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your USMLE Application
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant analysis and ranking of your residency application using advanced AI-powered parsing technology.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <FileUpload onFileUpload={handleFileUpload} />

          {uploadState.isUploading && (
            <div className="mt-6 flex items-center justify-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-lg text-gray-700">Uploading and analyzing your PDF...</span>
            </div>
          )}

          {uploadState.error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error: {uploadState.error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {uploadState.parsedData && (
          <div className="space-y-8">
            <ParsedDataDisplay data={uploadState.parsedData} />

            {uploadState.isParsing && (
              <div className="flex items-center justify-center space-x-3 py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-700">Calculating your ranking...</span>
              </div>
            )}

            {uploadState.ranking && (
              <RankingDisplay ranking={uploadState.ranking} />
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <Upload className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Upload</h3>
            <p className="text-gray-600">Drag and drop your PDF or click to browse. Secure processing in seconds.</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <FileText className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Smart Parsing</h3>
            <p className="text-gray-600">AI-powered extraction of visa status, USMLE scores, and ECFMG certification.</p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Ranking</h3>
            <p className="text-gray-600">Compare against 200+ synthetic applications for accurate ranking analysis.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 RankRx Light. Built with Next.js and Vercel.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}