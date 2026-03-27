/**
 * Safe configuration patching utilities
 * Handles package.json, tsconfig.json, and vite.config.ts modifications
 */

import fs from "fs";
import path from "path";

/**
 * Safely modify a JSON file
 * @param {string} filePath - Path to JSON file
 * @param {Function} modifier - Function that receives parsed JSON and returns { content, changes: string[] }
 * @param {boolean} dryRun - If true, don't write to disk
 * @returns {Object} { modified: boolean, changes: Array<string>, error?: string }
 */
export function patchJsonFile(filePath, modifier, dryRun = false) {
  try {
    if (!fs.existsSync(filePath)) {
      return { modified: false, changes: [], error: "File not found" };
    }

    const originalContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(originalContent);

    // Call modifier and get back { content, changes }
    const result = modifier(data);
    const { content: modified, changes = [] } = result;

    const newContent = JSON.stringify(modified, null, 2) + "\n";

    // Normalize line endings for comparison (handle both \n and \r\n)
    const originalNormalized = originalContent.replace(/\r\n/g, "\n");
    const newNormalized = newContent.replace(/\r\n/g, "\n");

    if (originalNormalized === newNormalized) {
      return { modified: false, changes, note: "No changes needed" };
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, newContent);
    }

    return { modified: true, changes, dryRun };
  } catch (error) {
    return { modified: false, changes: [], error: error.message };
  }
}

/**
 * Patch a TypeScript/JavaScript file using regex (use with caution)
 * @param {string} filePath - Path to file
 * @param {Array} replacements - Array of {pattern: RegExp, replacement: string, description: string}
 * @param {boolean} dryRun - If true, don't write to disk
 * @returns {Object} { modified: boolean, changes: Array<string>, error?: string }
 */
export function patchTextFile(filePath, replacements, dryRun = false) {
  const changes = [];
  try {
    if (!fs.existsSync(filePath)) {
      return { modified: false, changes, error: "File not found" };
    }

    let content = fs.readFileSync(filePath, "utf-8");
    let modified = false;

    for (const { pattern, replacement, description } of replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
        changes.push(description);
      }
    }

    if (!modified) {
      return { modified: false, changes, note: "No changes needed" };
    }

    if (!dryRun) {
      fs.writeFileSync(filePath, content);
    }

    return { modified: true, changes, dryRun };
  } catch (error) {
    return { modified: false, changes, error: error.message };
  }
}

/**
 * Ensure a property exists in an object, optionally merging with existing values
 */
export function ensureProperty(obj, prop, value, merge = false) {
  if (merge && obj[prop] && typeof obj[prop] === "object") {
    obj[prop] = { ...obj[prop], ...value };
  } else {
    obj[prop] = value;
  }
}

/**
 * Ensure nested property in an object
 */
export function ensureNestedProperty(obj, path, value) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Remove a property from an object
 */
export function removeProperty(obj, prop) {
  delete obj[prop];
}

/**
 * Scan source files for specific imports
 */
export function scanForImports(srcDir, importPatterns) {
  const detected = new Set();

  if (!fs.existsSync(srcDir)) return detected;

  try {
    const files = fs.readdirSync(srcDir);
    for (const file of files) {
      if ((file.endsWith(".ts") || file.endsWith(".tsx")) && !file.endsWith(".d.ts")) {
        const filePath = path.join(srcDir, file);
        const content = fs.readFileSync(filePath, "utf-8");

        for (const pattern of importPatterns) {
          if (
            content.includes(`from '${pattern.pkg}'`) ||
            content.includes(`from "${pattern.pkg}"`)
          ) {
            detected.add(pattern);
          }
        }
      }
    }
  } catch (error) {
    console.warn(`Warning scanning ${srcDir}:`, error.message);
  }

  return detected;
}

/**
 * Format a list of changes for display
 */
export function formatChanges(description, changes, dryRun = false) {
  const lines = [];
  if (dryRun) lines.push(`   [DRY-RUN] ${description}`);
  else if (changes.length === 0) lines.push(`   [-] ${description} (no changes)`);
  else {
    lines.push(`   [✓] ${description}`);
    changes.forEach((change) => lines.push(`       - ${change}`));
  }
  return lines.join("\n");
}
