import { AnalysisResult } from '../types';

const STORAGE_KEY = 'KINEMOTION_HISTORY_V1';

export const saveResult = (result: AnalysisResult) => {
  try {
    const existing = getHistory();
    const updated = [result, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const getHistory = (): AnalysisResult[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
};