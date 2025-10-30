/**
 * Generate build info for version tracking
 */
import { execSync } from 'child_process';

/**
 * Get git commit SHA
 */
function getGitCommitSha() {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get git branch name
 */
function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get git commit message
 */
function getGitCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B').toString().trim();
  } catch {
    return 'unknown';
  }
}

/**
 * Get current timestamp
 */
function getBuildTime() {
  return new Date().toISOString();
}

/**
 * Generate build info object
 */
export function generateBuildInfo() {
  return {
    VITE_GIT_COMMIT_SHA: getGitCommitSha(),
    VITE_GIT_BRANCH: getGitBranch(),
    VITE_GIT_COMMIT_MESSAGE: getGitCommitMessage(),
    VITE_BUILD_TIME: getBuildTime(),
    VITE_APP_VERSION: process.env.npm_package_version || '1.0.0',
  };
}

/**
 * Vite plugin to inject build info
 */
export function buildInfoPlugin() {
  const buildInfo = generateBuildInfo();

  return {
    name: 'build-info',
    config() {
      return {
        define: {
          'import.meta.env.VITE_GIT_COMMIT_SHA': JSON.stringify(buildInfo.VITE_GIT_COMMIT_SHA),
          'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(buildInfo.VITE_GIT_BRANCH),
          'import.meta.env.VITE_GIT_COMMIT_MESSAGE': JSON.stringify(buildInfo.VITE_GIT_COMMIT_MESSAGE),
          'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildInfo.VITE_BUILD_TIME),
          'import.meta.env.VITE_APP_VERSION': JSON.stringify(buildInfo.VITE_APP_VERSION),
        },
      };
    },
  };
}
