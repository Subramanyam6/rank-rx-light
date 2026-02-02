'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, TrendingUp, Award, Loader2, Download, Play, ExternalLink, X } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import ParsedDataDisplay from '@/components/ParsedDataDisplay';
import RankingDisplay from '@/components/RankingDisplay';
import { UploadState, ParsedApplication, RankingInfo } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Toggle this to false to restore the original interactive experience.
const MAINTENANCE_MODE = false;
const PORTFOLIO_FILENAME = 'Chintamadaka, Sreemedha_Architecture Portfolio.pdf';
const SAMPLE_PDF_PATH = '/sample.pdf';

// Mock data for local development (API only works on Vercel)
const MOCK_PARSED_DATA: ParsedApplication = {
  file: 'sample.pdf',
  visa: {
    authorized_to_work_us: 'Yes',
    current_work_authorization: 'H-1B',
    visa_sponsorship_needed: 'No',
    visa_sponsorship_sought: null,
  },
  usmle: {
    step1: {
      present: true,
      passed: true,
      pass_date: '2023-06-15',
      score: null,
      failures: 0,
    },
    step2_ck: {
      present: true,
      passed: true,
      pass_date: '2024-01-20',
      score: '248',
      failures: 0,
    },
  },
  ecfmg_status_report: {
    present: true,
    certified: 'Yes',
  },
};

export default function Home() {
  if (MAINTENANCE_MODE) {
    const downloadHref = `/${encodeURIComponent(PORTFOLIO_FILENAME)}`;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-xl w-full">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-blue-600 mx-auto mb-6">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-3">
              Portfolio temporarily available via direct download
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We&apos;ve paused the interactive features for now. You can download Sreemedha
              Chintamadaka&apos;s architecture portfolio directly using the button below.
            </p>
            <Button variant="blue" asChild size="lg">
              <a href={downloadHref} download={PORTFOLIO_FILENAME}>
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </a>
            </Button>
            <p className="text-xs text-muted-foreground mt-6">Filename: {PORTFOLIO_FILENAME}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    isParsing: false,
    error: null,
    parsedData: null,
    ranking: null,
  });

  const processFile = useCallback(async (file: File, useMockData = false) => {
    setUploadState({
      isUploading: true,
      isParsing: false,
      error: null,
      parsedData: null,
      ranking: null,
    });

    try {
      let parsedData: ParsedApplication | null = null;

      if (useMockData) {
        // Use mock data for demo/development
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        parsedData = { ...MOCK_PARSED_DATA, file: file.name };
      } else {
        try {
          const uploadResponse = await fetch('/api/parse-pdf.py', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/pdf'
            },
            body: file,
          });

          if (uploadResponse.ok) {
            parsedData = await uploadResponse.json();
          } else if (uploadResponse.status === 413) {
            throw new Error('PDF too large. Please upload a file under 4MB.');
          } else if (uploadResponse.status === 404) {
            // API not available (local dev) - use mock data
            console.log('API not available, using mock data for demo');
            await new Promise(resolve => setTimeout(resolve, 500));
            parsedData = { ...MOCK_PARSED_DATA, file: file.name };
          } else {
            // Try to get error message from response
            const err = await uploadResponse.json().catch(() => null);
            throw new Error(err?.error || 'Failed to upload PDF');
          }
        } catch (fetchError) {
          // Network error or API not running - use mock data
          if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
            console.log('Network error, using mock data for demo');
            await new Promise(resolve => setTimeout(resolve, 500));
            parsedData = { ...MOCK_PARSED_DATA, file: file.name };
          } else {
            throw fetchError;
          }
        }
      }

      // Ensure parsedData is defined
      if (!parsedData) {
        parsedData = { ...MOCK_PARSED_DATA, file: file.name };
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        isParsing: true,
        parsedData,
      }));

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

  const handleFileUpload = useCallback(async (file: File) => {
    await processFile(file);
  }, [processFile]);

  const handleTrySample = useCallback(async () => {
    setUploadState({
      isUploading: true,
      isParsing: false,
      error: null,
      parsedData: null,
      ranking: null,
    });

    try {
      // Fetch the sample PDF from public folder
      const response = await fetch(SAMPLE_PDF_PATH);
      if (!response.ok) {
        throw new Error('Failed to load sample PDF');
      }
      const blob = await response.blob();
      const file = new File([blob], 'sample.pdf', { type: 'application/pdf' });
      
      await processFile(file);
    } catch (error) {
      setUploadState({
        isUploading: false,
        isParsing: false,
        error: error instanceof Error ? error.message : 'Failed to load sample',
        parsedData: null,
        ranking: null,
      });
    }
  }, [processFile]);

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
      const response = await fetch('/synthetic_applicants.json');
      const syntheticData: ParsedApplication[] = await response.json();

      const uploadedScore = calculateScore(parsedData);

      const allScores = syntheticData.map(app => ({
        score: calculateScore(app),
        isUploaded: false,
      }));

      allScores.push({
        score: uploadedScore,
        isUploaded: true,
      });

      allScores.sort((a, b) => b.score - a.score);

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

    return Math.round(score * 10000) / 10000;
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-200 sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-neutral-800 rounded-lg p-2">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">RankRx Light</h1>
                <p className="text-sm text-muted-foreground">Residency Application Analysis</p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1 bg-neutral-200 text-neutral-700">
              <TrendingUp className="h-3 w-3" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 border-neutral-300 text-neutral-600">
            Advanced ERAS Analysis
          </Badge>
          <h2 className="text-4xl font-bold mb-4">
            Upload Your ERAS Application
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get instant AI-powered analysis and ranking of your residency application.
            Compare against 200+ synthetic applicants for accurate performance insights.
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <FileUpload onFileUpload={handleFileUpload} onFileRemove={handleFileRemove} />

          {/* Try Sample Button */}
          {!uploadState.parsedData && !uploadState.isUploading && (
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px bg-neutral-300 flex-1 max-w-20"></div>
                <span className="text-sm text-muted-foreground">or</span>
                <div className="h-px bg-neutral-300 flex-1 max-w-20"></div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="green"
                  onClick={handleTrySample}
                  disabled={uploadState.isUploading}
                >
                  <Play className="h-4 w-4" />
                  Try Sample Application
                </Button>
                <Button
                  variant="secondary"
                  className="bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  asChild
                >
                  <a href={SAMPLE_PDF_PATH} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    View PDF
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                See how it works with a sample ERAS application
              </p>
            </div>
          )}

          {uploadState.isUploading && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-muted-foreground">Uploading and analyzing your PDF...</span>
            </div>
          )}

          {uploadState.error && (
            <Card className="mt-6 border-red-300 bg-red-50">
              <CardContent className="pt-4 pb-4">
                <p className="text-red-700 font-medium">Error: {uploadState.error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Section */}
        {uploadState.parsedData && (
          <div className="space-y-8">
            <Card className="bg-white relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFileRemove}
                className="absolute top-4 right-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
              <CardContent className="pt-6">
                <ParsedDataDisplay data={uploadState.parsedData} />
              </CardContent>
            </Card>

            {uploadState.isParsing && (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <div className="text-center">
                  <span className="text-lg font-medium block">Analyzing Your Application</span>
                  <span className="text-sm text-muted-foreground">Comparing against 200+ synthetic applicants...</span>
                </div>
              </div>
            )}

            {uploadState.ranking && (
              <Card className="bg-white">
                <CardContent className="pt-6">
                  <RankingDisplay ranking={uploadState.ranking} />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex p-3 bg-blue-100 rounded-lg mb-4">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Easy Upload</h3>
              <p className="text-muted-foreground text-sm">
                Drag and drop your PDF or click to browse. Secure processing with instant feedback.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex p-3 bg-green-100 rounded-lg mb-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Parsing</h3>
              <p className="text-muted-foreground text-sm">
                Advanced extraction of visa status, USMLE scores, and ECFMG certification.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex p-3 bg-red-100 rounded-lg mb-4">
                <Award className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Intelligent Ranking</h3>
              <p className="text-muted-foreground text-sm">
                Compare against 200+ synthetic applicants for accurate percentile ranking.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 mt-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-neutral-800 rounded flex items-center justify-center">
                <FileText className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium">RankRx Light</span>
            </div>
            <p className="text-muted-foreground text-sm mb-3">USMLE Application Analysis</p>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span>Advanced Parsing</span>
              <span>Smart Ranking</span>
              <span>Secure Processing</span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">2024 RankRx Light. Built with Next.js.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
