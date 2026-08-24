/**
 * MongoDB Atlas REST Client
 * Unified asynchronous API bridge for persistence.
 */

export async function fetchDbStatus() {
  try {
    const res = await fetch('/api/db-status');
    return await res.json();
  } catch (err) {
    return { status: 'disconnected', error: err.message };
  }
}

export async function fetchSessions() {
  try {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    return data.success && Array.isArray(data.sessions) ? data.sessions : [];
  } catch (err) {
    return [];
  }
}

export async function saveSession(sessionData) {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function deleteSessionRemote(sessionId) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveHierarchyFlow(flowData) {
  try {
    const res = await fetch('/api/flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flowData)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function saveQuizResult(quizData) {
  try {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizData)
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
}
