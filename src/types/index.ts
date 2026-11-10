export type AnalysisStatus = 'pending' | 'extracting' | 'identifying' | 'researching' | 'verifying' | 'rewriting' | 'completed' | 'error';

export type ClaimType = 'factual' | 'opinion' | 'metaphor' | 'philosophical' | 'prediction' | 'unverifiable';

export type VerificationStatus = 'supported' | 'contradicted' | 'unresolved' | 'insufficient_evidence';

export type RecommendationClassification = 'supports' | 'challenges' | 'contextualizes' | 'explores';

export type RewriteMode = 'factual' | 'exploratory';

export interface AnalysisRecord {
  id: string;
  title: string;
  topic: string;
  status: AnalysisStatus;
  image_path: string | null;
  image_url: string | null;
  extracted_text: string | null;
  extracted_text_edited: string | null;
  concise_assessment: string | null;
  summary: {
    supported: number;
    contradicted: number;
    unresolved: number;
  } | null;
  factual_rewrite: string | null;
  exploratory_rewrite: string | null;
  claims: ClaimAssessment[];
  recommendations: Recommendation[];
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimAssessment {
  id: string;
  claim_text: string;
  claim_type: ClaimType;
  verification_status: VerificationStatus;
  explanation: string;
  evidence_summary: string;
  sources: EvidenceSource[];
  uncertainty: string | null;
}

export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  author: string | null;
  publication: string | null;
  date: string | null;
  passage: string;
  relevance: string;
}

export interface Recommendation {
  id: string;
  title: string;
  author: string;
  publication_info: string | null;
  url: string;
  relevance_explanation: string;
  classification: RecommendationClassification;
}

export interface PipelineStage {
  key: AnalysisStatus;
  label: string;
  description: string;
  status: 'pending' | 'active' | 'done' | 'error';
}

export interface ApiStatus {
  ocr: 'connected' | 'not_configured' | 'error';
  research: 'connected' | 'not_configured' | 'error';
  clocked: 'connected' | 'not_configured' | 'error';
  rewrite: 'connected' | 'not_configured' | 'error';
}
