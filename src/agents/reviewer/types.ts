export interface ReviewerInput {
  prNumber: number;
  reviewPass: number;
  maxReviewPasses: number;
}

export interface ReviewerResult {
  reviewResult: string;
  reviewDone: boolean;
}

export interface DiffFile {
  filename: string;
  status: string;
  patch: string;
}

export interface Rule {
  source: string;
  content: string;
}

export interface Violation {
  file: string;
  line: number;
  text: string;
  criticality: string;
  posted: boolean;
}
