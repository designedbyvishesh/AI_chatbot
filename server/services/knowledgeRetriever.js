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
 * If a userMessage is provided, picks the single most relevant file.
 * Otherwise returns a summary from the first file.
 * 
 * @param {string} topic - Topic key (e.g., 'design-systems')
 * @param {string} [userMessage] - Latest user message to pick relevant knowledge
 * @returns {string} Markdown content (capped to ~3000 chars to fit token limits)
 */
function getContext(topic, userMessage = '') {
  const sources = loadSources();
  const topicConfig = sources.topics[topic];

  if (!topicConfig || !topicConfig.files) {
    console.warn(`[KnowledgeRetriever] No knowledge files found for topic: "${topic}"`);
    return '';
  }

  // Keyword-to-file mapping for smart selection
  const keywordMap = {
    'token': 'token-architecture.md',
    'primitive': 'token-architecture.md',
    'semantic': 'token-architecture.md',
    'variable': 'token-architecture.md',
    'style dictionary': 'token-architecture.md',
    'component': 'component-api-patterns.md',
    'prop': 'component-api-patterns.md',
    'compound': 'component-api-patterns.md',
    'headless': 'component-api-patterns.md',
    'variant': 'component-api-patterns.md',
    'radix': 'component-api-patterns.md',
    'accessibility': 'component-api-patterns.md',
    'aria': 'component-api-patterns.md',
    'theme': 'theming-strategies.md',
    'dark mode': 'theming-strategies.md',
    'light mode': 'theming-strategies.md',
    'brand': 'theming-strategies.md',
    'css variable': 'theming-strategies.md',
    'custom propert': 'theming-strategies.md',
    'naming': 'naming-conventions.md',
    'bem': 'naming-conventions.md',
    'convention': 'naming-conventions.md',
    'cti': 'naming-conventions.md',
    'figma': 'figma-to-code.md',
    'handoff': 'figma-to-code.md',
    'auto layout': 'figma-to-code.md',
    'storybook': 'figma-to-code.md',
    'dev mode': 'figma-to-code.md',
    'scal': 'scaling-patterns.md',
    'monorepo': 'scaling-patterns.md',
    'version': 'scaling-patterns.md',
    'semver': 'scaling-patterns.md',
    'contribut': 'scaling-patterns.md',
    'deprecat': 'scaling-patterns.md'
  };

  // Find the best matching file
  let targetFile = null;
  const lower = userMessage.toLowerCase();

  for (const [keyword, file] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      targetFile = file;
      break;
    }
  }

  // Pick the file to load
  let fileToLoad;
  if (targetFile) {
    fileToLoad = topicConfig.files.find(f => f.endsWith(targetFile));
  }
  if (!fileToLoad) {
    // Random selection to vary questions
    const idx = Math.floor(Math.random() * topicConfig.files.length);
    fileToLoad = topicConfig.files[idx];
  }

  const filePath = path.join(KNOWLEDGE_DIR, fileToLoad);
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Cap at ~3000 chars to stay within Groq free tier token limits
    if (content.length > 3000) {
      content = content.substring(0, 3000) + '\n\n[...truncated for brevity]';
    }
    return `--- ${path.basename(fileToLoad, '.md').replace(/-/g, ' ').toUpperCase()} ---\n${content}`;
  } catch (err) {
    console.warn(`[KnowledgeRetriever] Could not read ${fileToLoad}:`, err.message);
    return '';
  }
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
