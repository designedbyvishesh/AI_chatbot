/**
 * Central Reactive State Manager
 * Holds runtime session data, provider configurations, and view flags.
 */

export const state = {
  isProcessing: false,
  processingIntervals: [],
  currentQuizIndex: 0,
  isQuestioningMode: true,
  activeSessionId: null,
  allSessions: JSON.parse(localStorage.getItem('design_chat_sessions') || '[]'),
  
  aiConfig: {
    mode: localStorage.getItem('ai_mode') || 'builtin',
    geminiKey: localStorage.getItem('gemini_api_key') || '',
    groqKey: localStorage.getItem('groq_api_key') || ''
  }
};

export function saveSessionsToStorage() {
  localStorage.setItem('design_chat_sessions', JSON.stringify(state.allSessions));
}

export function saveAIConfigToStorage() {
  localStorage.setItem('ai_mode', state.aiConfig.mode);
  localStorage.setItem('gemini_api_key', state.aiConfig.geminiKey);
  localStorage.setItem('groq_api_key', state.aiConfig.groqKey);
}
