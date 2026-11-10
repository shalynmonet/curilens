import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AnalysisRecord } from '@/types';

const EDGE_FUNCTION_BASE = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : '';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  if (anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
    headers['apikey'] = anonKey;
  }
  return headers;
}

export async function uploadScreenshot(file: File): Promise<{ path: string; url: string } | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const ext = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
  const path = `uploads/${fileName}`;

  const { error } = await supabase.storage.from('screenshots').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage.from('screenshots').createSignedUrl(path, 3600);
  const url = urlData?.signedUrl || path;

  return { path, url };
}

export async function createAnalysis(imagePath: string, imageUrl: string): Promise<string | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      image_path: imagePath,
      image_url: imageUrl,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create analysis error:', error);
    return null;
  }

  return data.id;
}

export async function submitForAnalysis(analysisId: string, imagePath: string): Promise<boolean> {
  if (!EDGE_FUNCTION_BASE) return false;

  try {
    const response = await fetch(`${EDGE_FUNCTION_BASE}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ analysisId, imagePath }),
    });

    if (!response.ok) {
      console.error('Analyze trigger failed:', response.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Analyze trigger error:', err);
    return false;
  }
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  if (!supabase || !isSupabaseConfigured) return null;

  const { data: analysis, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !analysis) {
    console.error('Get analysis error:', error);
    return null;
  }

  const { data: claims } = await supabase
    .from('claims')
    .select('*')
    .eq('analysis_id', id)
    .order('created_at', { ascending: true });

  const claimsWithSources = await Promise.all(
    (claims || []).map(async (claim) => {
      const { data: sources } = await supabase
        .from('evidence_sources')
        .select('*')
        .eq('claim_id', claim.id)
        .order('created_at', { ascending: true });

      return {
        id: claim.id,
        claim_text: claim.claim_text,
        claim_type: claim.claim_type,
        verification_status: claim.verification_status,
        explanation: claim.explanation || '',
        evidence_summary: claim.evidence_summary || '',
        sources: (sources || []).map((s) => ({
          id: s.id,
          title: s.title,
          url: s.url,
          author: s.author,
          publication: s.publication,
          date: s.date,
          passage: s.passage,
          relevance: s.relevance,
        })),
        uncertainty: claim.uncertainty,
      };
    })
  );

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*')
    .eq('analysis_id', id)
    .order('created_at', { ascending: true });

  return {
    id: analysis.id,
    title: analysis.title || 'Untitled Analysis',
    topic: analysis.topic || '',
    status: analysis.status,
    image_url: analysis.image_url,
    extracted_text: analysis.extracted_text,
    extracted_text_edited: analysis.extracted_text_edited,
    concise_assessment: analysis.concise_assessment,
    summary: {
      supported: analysis.supported_count || 0,
      contradicted: analysis.contradicted_count || 0,
      unresolved: analysis.unresolved_count || 0,
    },
    factual_rewrite: analysis.factual_rewrite,
    exploratory_rewrite: analysis.exploratory_rewrite,
    claims: claimsWithSources,
    recommendations: (recommendations || []).map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      publication_info: r.publication_info,
      url: r.url,
      relevance_explanation: r.relevance_explanation,
      classification: r.classification,
    })),
    error_message: analysis.error_message,
    created_at: analysis.created_at,
    updated_at: analysis.updated_at,
  };
}

export async function getRecentAnalyses(limit = 5): Promise<AnalysisRecord[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    title: a.title || 'Untitled Analysis',
    topic: a.topic || '',
    status: a.status,
    image_url: a.image_url,
    extracted_text: a.extracted_text,
    extracted_text_edited: a.extracted_text_edited,
    concise_assessment: a.concise_assessment,
    summary: {
      supported: a.supported_count || 0,
      contradicted: a.contradicted_count || 0,
      unresolved: a.unresolved_count || 0,
    },
    factual_rewrite: a.factual_rewrite,
    exploratory_rewrite: a.exploratory_rewrite,
    claims: [],
    recommendations: [],
    error_message: a.error_message,
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));
}

export async function getAllAnalyses(): Promise<AnalysisRecord[]> {
  if (!supabase || !isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    title: a.title || 'Untitled Analysis',
    topic: a.topic || '',
    status: a.status,
    image_url: a.image_url,
    extracted_text: a.extracted_text,
    extracted_text_edited: a.extracted_text_edited,
    concise_assessment: a.concise_assessment,
    summary: {
      supported: a.supported_count || 0,
      contradicted: a.contradicted_count || 0,
      unresolved: a.unresolved_count || 0,
    },
    factual_rewrite: a.factual_rewrite,
    exploratory_rewrite: a.exploratory_rewrite,
    claims: [],
    recommendations: [],
    error_message: a.error_message,
    created_at: a.created_at,
    updated_at: a.updated_at,
  }));
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  const { error } = await supabase.from('analyses').delete().eq('id', id);
  return !error;
}

export async function updateExtractedText(id: string, text: string): Promise<boolean> {
  if (!supabase || !isSupabaseConfigured) return false;

  const { error } = await supabase
    .from('analyses')
    .update({ extracted_text_edited: text, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteScreenshot(path: string): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  await supabase.storage.from('screenshots').remove([path]);
}
