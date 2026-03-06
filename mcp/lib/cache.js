/**
 * Agenticana MCP — Shared Library: Cache & Error Handling
 *
 * Provides:
 *   - LRU cache with TTL and mtime-based invalidation
 *   - Enhanced error handling with structured responses
 */

"use strict";

// ── LRU Cache with TTL ────────────────────────────────────────────────────────

class LRUCache {
  constructor(maxSize = 50, ttlMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value, metadata = {}) {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      metadata,
    });
  }

  invalidate(pattern) {
    if (typeof pattern === "string") {
      this.cache.delete(pattern);
    } else if (pattern instanceof RegExp) {
      // Invalidate all matching keys
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clear() {
    this.cache.clear();
  }

  stats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      oldestEntry:
        this.cache.size > 0
          ? Date.now() - Array.from(this.cache.values())[0].timestamp
          : null,
    };
  }
}

// Singleton instance
const globalCache = new LRUCache();

// ── Error Handling ────────────────────────────────────────────────────────────

/**
 * Wrap Python script execution with error handling and retries.
 * @param {Function} fn - Function that returns execSync result
 * @param {object} options - { retries, timeout, hint }
 * @returns {object} - Parsed result or error object
 */
async function withErrorHandling(fn, options = {}) {
  const {
    retries = 1,
    timeout = 30000,
    hint = "Check that Python and dependencies are installed",
  } = options;

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await fn();

      // Try to parse as JSON
      try {
        return JSON.parse(result);
      } catch {
        return { output: result };
      }
    } catch (err) {
      lastError = err;

      // Don't retry on timeout
      if (err.killed || err.signal === "SIGTERM") {
        break;
      }

      // Brief delay before retry
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Format error response
  return {
    error: lastError.message || "Unknown error",
    stderr: lastError.stderr,
    code: lastError.code,
    signal: lastError.signal,
    hint,
    retries_attempted: retries,
  };
}

/**
 * Format tool response with consistent structure.
 */
function formatResponse(data, status = "success") {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            status,
            timestamp: new Date().toISOString(),
            ...data,
          },
          null,
          2,
        ),
      },
    ],
  };
}

/**
 * Format error response with remediation hints.
 */
function formatError(error, context = {}) {
  const hints = {
    ENOENT: "File or script not found. Check installation.",
    ETIMEDOUT:
      "Operation timed out. Try increasing timeout or simplifying the task.",
    EACCES: "Permission denied. Check file/directory permissions.",
  };

  return formatResponse(
    {
      error: error.message || error,
      context,
      hint: hints[error.code] || error.hint || "Check logs for details",
    },
    "error",
  );
}

// ── File Mtime Tracking ───────────────────────────────────────────────────────

const fs = require("fs");

/**
 * Get cache key with file mtime for automatic invalidation.
 */
function getCacheKeyWithMtime(key, filePath) {
  try {
    const stats = fs.statSync(filePath);
    return `${key}:${stats.mtimeMs}`;
  } catch {
    return key;
  }
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  LRUCache,
  globalCache,
  withErrorHandling,
  formatResponse,
  formatError,
  getCacheKeyWithMtime,
};
