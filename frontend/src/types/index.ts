// Types for USMLE Application Data

export interface VisaInfo {
  authorized_to_work_us: string | null;
  current_work_authorization: string | null;
  visa_sponsorship_needed: string | null;
  visa_sponsorship_sought: string | null;
}

export interface USMLEStepResult {
  present: boolean;
  passed: boolean;
  pass_date: string | null;
  score: string | null;
  failures: number;
}

export interface USMLEResults {
  step1: USMLEStepResult;
  step2_ck: USMLEStepResult;
}

export interface ECFMGStatus {
  present: boolean;
  certified: string;
}

export interface ParsedApplication {
  file: string;
  visa: VisaInfo;
  usmle: USMLEResults;
  ecfmg_status_report: ECFMGStatus;
  _rank_score?: number; // Added for ranking
}

export interface RankingInfo {
  rank: number;
  totalCandidates: number;
  percentile: number;
  score: number;
  betterThan: number;
}

export interface UploadState {
  isUploading: boolean;
  isParsing: boolean;
  error: string | null;
  parsedData: ParsedApplication | null;
  ranking: RankingInfo | null;
}
