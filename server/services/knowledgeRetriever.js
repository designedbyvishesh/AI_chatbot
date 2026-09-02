/**
 * Knowledge Retriever (RAG)
 * 
 * Reads curated markdown files from the knowledge base
 * and returns them as context for the LLM prompt.
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_DIR = path.join(__dirname, '..', 'knowledge');
const SOURCES_FILE = path.join(KNOWLEDGE_DIR, 'sources.json');

/**
 * Load the knowledge source registry
 */
function loadSources() {
  try {
    const raw = fs.readFileSync(SOURCES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[KnowledgeRetriever] Failed to load sources.json:', err.message);
    return { topics: {} };
  }
}

/**
 * Get concatenated knowledge context for a given topic.
 * 
 * @param {string} topic - Topic key (e.g., 'design-systems')
 * @returns {string} Concatenated markdown content from all knowledge files for that topic
 */
function getContext(topic) {
  const sources = loadSources();
  const topicConfig = sources.topics[topic];

  if (!topicConfig || !topicConfig.files) {
    console.warn(`[KnowledgeRetriever] No knowledge files found for topic: "${topic}"`);
    return '';
  }

  const chunks = [];

  for (const relPath of topicConfig.files) {
    const filePath = path.join(KNOWLEDGE_DIR, relPath);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      chunks.push(`--- ${path.basename(relPath, '.md').replace(/-/g, ' ').toUpperCase()} ---\n${content}`);
    } catch (err) {
      console.warn(`[KnowledgeRetriever] Could not read ${relPath}:`, err.message);
    }
  }

  return chunks.join('\n\n');
}

/**
 * List all available topics with their labels
 */
function listTopics() {
  const sources = loadSources();
  return Object.entries(sources.topics).map(([key, val]) => ({
    key,
    label: val.label,
    fileCount: val.files ? val.files.length : 0
  }));
}

module.exports = { getContext, listTopics };
