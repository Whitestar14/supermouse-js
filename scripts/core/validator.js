/**
 * Validation utilities for package names and configurations
 */

import { logger } from "./logger.js";

export class Validator {
  static isKebabCase(str) {
    return /^[a-z][a-z0-9-]*$/.test(str);
  }

  static isPascalCase(str) {
    return /^[A-Z][a-zA-Z0-9]*$/.test(str);
  }

  static validatePackageName(name) {
    if (!name) {
      throw new Error("Package name cannot be empty");
    }

    if (!this.isKebabCase(name)) {
      throw new Error(
        `Invalid package name "${name}". Must be kebab-case (e.g., "cool-effect")`
      );
    }

    if (name.length > 50) {
      throw new Error("Package name is too long (max 50 characters)");
    }

    // Avoid common reserved names
    const reserved = ["core", "utils", "react", "vue", "test", "spec"];
    if (reserved.includes(name)) {
      throw new Error(`Package name "${name}" is reserved`);
    }

    return true;
  }

  static validateFilePath(filePath) {
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid file path");
    }
    return true;
  }

  static validateJSON(obj) {
    if (obj === null || typeof obj !== "object") {
      throw new Error("Invalid JSON object");
    }
    return true;
  }

  static validateTsConfig(config) {
    if (!config.compilerOptions) {
      throw new Error("tsconfig.json must have compilerOptions");
    }
    return true;
  }

  static validatePackageJSON(pkg) {
    if (!pkg.name || typeof pkg.name !== "string") {
      throw new Error("package.json must have a valid name");
    }
    if (!pkg.version || typeof pkg.version !== "string") {
      throw new Error("package.json must have a valid version");
    }
    return true;
  }

  static async validateNotExists(path, fileOps) {
    if (fileOps.exists(path)) {
      throw new Error(`Path already exists: ${path}`);
    }
    return true;
  }

  static async validateExists(path, fileOps) {
    if (!fileOps.exists(path)) {
      throw new Error(`Path does not exist: ${path}`);
    }
    return true;
  }
}

export const validator = new Validator();
