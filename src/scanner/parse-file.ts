import { parse } from "@babel/parser";
import type { File } from "@babel/types";

export interface ParsedFile {
  ast: File | null;
  error?: Error;
}

export function parseFile(source: string, filePath: string): ParsedFile {
  try {
    return {
      ast: parse(source, {
        sourceFilename: filePath,
        sourceType: "unambiguous",
        errorRecovery: true,
        plugins: ["jsx", "typescript", "decorators-legacy"],
      }),
    };
  } catch (error) {
    return {
      ast: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}
