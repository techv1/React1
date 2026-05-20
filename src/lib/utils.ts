import type { Video } from './types';

export const PAGE_SIZE = 60;
export const RECOMMENDATION_SEED = Date.now();

export function tokenize(text: string): string[] {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').split(/\s+/).filter(w => w.length > 2);
}

export function seededShuffle<T>(list: T[], seed: number): T[] {
  const arr = [...list];
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  const rand = () => (state = state * 16807 % 2147483647) / 2147483647;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function similarityScore(current: Video, candidate: Video, historyStack: Video[] = []): number {
  if (current.id === candidate.id) return -1;
  let score = 0;

  // Keyword-based matching
  const currentKeywords = (current.keywords || []).map(k => k.toLowerCase());
  const candidateKeywords = (candidate.keywords || []).map(k => k.toLowerCase());
  
  const commonKeywords = candidateKeywords.filter(k => currentKeywords.includes(k));
  score += commonKeywords.length * 20;

  // Title-based matching
  const currentTitleTokens = tokenize(current.title);
  const candidateTitleTokens = tokenize(candidate.title);
  const commonTitleTokens = candidateTitleTokens.filter(t => currentTitleTokens.includes(t));
  score += commonTitleTokens.length * 15;

  // History influence
  if (historyStack.length > 0) {
    const historyKeywords = historyStack.flatMap(v => (v.keywords || []).map(k => k.toLowerCase()));
    const historyMatches = candidateKeywords.filter(k => historyKeywords.includes(k)).length;
    score += historyMatches * 5;
  }

  // Boost for high-rated videos
  score += parseFloat(candidate.rate || '0') * 5;

  return score;
}

export function normalizeRow(row: any): Video {
  return {
    ...row,
    id: String(row.id),
    title: row.title || 'Untitled',
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    embedUrl: `https://www.eporner.com/embed/${row.id}/`,
    pageUrl: `https://www.eporner.com/video-${row.id}/`
  };
}
