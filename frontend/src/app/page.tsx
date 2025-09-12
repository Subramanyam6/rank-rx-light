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

      // Prefer sending raw file to match current Python handler, but include headers for Vercel
      const uploadResponse = await fetch('/api/parse-pdf.py', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        if (uploadResponse.status === 413) {
          throw new Error('PDF too large. Please upload a file under 4MB.');
        }
        // Try to parse error body for more details
        try {
          const err = await uploadResponse.json();
          throw new Error(err?.error || 'Failed to upload PDF');
        } catch (_) {
          throw new Error('Failed to upload PDF');
        }
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

  const handleFileRemove = useCallback(() => {
    setUploadState({
      isUploading: false,
      isParsing: false,
      error: null,
      parsedData: null,
      ranking: null,
    });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 animate-fade-in">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-3 shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  RankRx Light
                </h1>
                <p className="text-sm text-gray-600 font-medium">AI-Powered Residency Application Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <TrendingUp className="h-5 w-5 text-blue-600 animate-pulse" />
                <span className="text-sm font-semibold text-blue-700">AI-Powered Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-block p-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl mb-6">
            <div className="bg-white rounded-xl px-6 py-2">
              <span className="text-sm font-semibold text-gray-700">✨ Advanced ERAS Analysis</span>
            </div>
          </div>
          <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Upload Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> ERAS Application</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Get instant AI-powered analysis and ranking of your residency application.
            Compare against 200+ synthetic applicants for accurate performance insights.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <FileUpload onFileUpload={handleFileUpload} onFileRemove={handleFileRemove} />

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
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
              <ParsedDataDisplay data={uploadState.parsedData} />
            </div>

            {uploadState.isParsing && (
              <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping"></div>
                </div>
                <div className="text-center">
                  <span className="text-xl font-semibold text-gray-700 mb-2 block">Analyzing Your Application</span>
                  <span className="text-sm text-gray-500">Comparing against 200+ synthetic applicants...</span>
                </div>
              </div>
            )}

            {uploadState.ranking && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl shadow-xl border border-green-200/50 p-8 animate-in slide-in-from-bottom-4 duration-500">
                <RankingDisplay ranking={uploadState.ranking} />
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group text-center p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 card-hover">
            <div className="mb-6">
              <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Upload className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Upload</h3>
            <p className="text-gray-600 leading-relaxed">Drag and drop your PDF or click to browse. Secure processing with instant feedback.</p>
          </div>

          <div className="group text-center p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 card-hover">
            <div className="mb-6">
              <div className="inline-flex p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Smart AI Parsing</h3>
            <p className="text-gray-600 leading-relaxed">Advanced regex-based extraction of visa status, USMLE scores, and ECFMG certification.</p>
          </div>

          <div className="group text-center p-8 bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 card-hover">
            <div className="mb-6">
              <div className="inline-flex p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Intelligent Ranking</h3>
            <p className="text-gray-600 leading-relaxed">Compare against 200+ synthetic applicants for accurate percentile ranking and insights.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200/50 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-6 mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-gray-700">RankRx Light</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">AI-Powered USMLE Application Analysis</p>
            <div className="flex justify-center space-x-6 text-sm text-gray-500">
              <span>✨ Advanced AI Parsing</span>
              <span>•</span>
              <span>📊 Smart Ranking</span>
              <span>•</span>
              <span>🔒 Secure Processing</span>
            </div>
            <p className="text-xs text-gray-400 mt-6">&copy; 2024 RankRx Light. Built with Next.js and Vercel.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}