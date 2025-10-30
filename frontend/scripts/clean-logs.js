#!/usr/bin/env node
/**
 * Clean excessive console.log statements from the codebase
 * Replaces them with proper logger calls
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const filesToClean = globSync('src/**/*.{js,jsx,ts,tsx}', {
  ignore: ['**/node_modules/**', '**/dist/**', '**/logger.ts']
});

const replacements = [
  // Remove excessive debug logs
  { pattern: /console\.log\('🔍 DEBUG.*?\);?\n?/gs, replacement: '' },
  { pattern: /console\.log\("🔍 DEBUG.*?\);?\n?/gs, replacement: '' },

  // Remove visual brain logs
  { pattern: /console\.log\('🔵 About to call.*?\);?\n?/gs, replacement: '' },
  { pattern: /console\.log\('🔵 visualBrainRef.*?\);?\n?/gs, replacement: '' },

  // Remove excessive status logs
  { pattern: /console\.log\('✅ .*?added to store.*?\);?\n?/gs, replacement: '' },
  { pattern: /console\.log\('📝 Adding.*?to store.*?\);?\n?/gs, replacement: '' },
  { pattern: /console\.log\('🔄 .*?loading messages.*?\);?\n?/gi, replacement: '' },

  // Remove payload logs
  { pattern: /console\.log\('📤 Sending.*?payload.*?\);?\n?/gi, replacement: '' },

  // Keep error logs but clean them
  { pattern: /console\.error\('❌ Error:', error\)/g, replacement: 'logger.error(error)' },
  { pattern: /console\.error\('Error:', error\)/g, replacement: 'logger.error(error)' },
];

let totalCleaned = 0;

console.log('🧹 Cleaning excessive console.log statements...\n');

filesToClean.forEach(file => {
  let content = readFileSync(file, 'utf-8');
  let fileModified = false;
  let fileCleanedCount = 0;

  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      fileModified = true;
      fileCleanedCount += matches.length;
      content = content.replace(pattern, replacement);
    }
  });

  if (fileModified) {
    // Add logger import if needed and not present
    if (content.includes('logger.') && !content.includes("from './utils/logger'") && !content.includes('from "../utils/logger"')) {
      const importStatement = "import { createLogger } from '../utils/logger';\n";

      // Find the last import statement
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfLine = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLine + 1) + importStatement + content.slice(endOfLine + 1);
      }
    }

    writeFileSync(file, content);
    console.log(`✅ ${file} - Cleaned ${fileCleanedCount} log statement(s)`);
    totalCleaned += fileCleanedCount;
  }
});

console.log(`\n✨ Done! Cleaned ${totalCleaned} log statement(s) across ${filesToClean.length} files.`);
