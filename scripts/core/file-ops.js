/**
 * Safe file operations with error handling
 */

import fs from "fs";
import path from "path";
import { logger } from "./logger.js";

export class FileOps {
  static readJSON(filePath) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      logger.error(`Failed to read JSON: ${filePath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static writeJSON(filePath, data, pretty = true) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
      fs.writeFileSync(filePath, content + "\n", "utf-8");
      return true;
    } catch (err) {
      logger.error(`Failed to write JSON: ${filePath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static readFile(filePath) {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      logger.error(`Failed to read file: ${filePath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static writeFile(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, "utf-8");
      return true;
    } catch (err) {
      logger.error(`Failed to write file: ${filePath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static exists(filePath) {
    return fs.existsSync(filePath);
  }

  static isDirectory(filePath) {
    try {
      return fs.statSync(filePath).isDirectory();
    } catch {
      return false;
    }
  }

  static isFile(filePath) {
    try {
      return fs.statSync(filePath).isFile();
    } catch {
      return false;
    }
  }

  static mkdir(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      return true;
    } catch (err) {
      logger.error(`Failed to create directory: ${dirPath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static listDir(dirPath, { ignoreHidden = true, filterExt = null } = {}) {
    try {
      let files = fs.readdirSync(dirPath);
      
      if (ignoreHidden) {
        files = files.filter(f => !f.startsWith("."));
      }
      
      if (filterExt) {
        files = files.filter(f => f.endsWith(filterExt));
      }
      
      return files;
    } catch (err) {
      logger.error(`Failed to list directory: ${dirPath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static removeDir(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
      return true;
    } catch (err) {
      logger.error(`Failed to remove directory: ${dirPath}`);
      logger.debug(err.message);
      throw err;
    }
  }

  static copy(src, dest) {
    try {
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.copyFileSync(src, dest);
      return true;
    } catch (err) {
      logger.error(`Failed to copy: ${src} → ${dest}`);
      logger.debug(err.message);
      throw err;
    }
  }
}

export const fileOps = new FileOps();
