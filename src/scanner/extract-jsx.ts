import type { File } from "@babel/types";
import type { JsxUsage } from "../core/types";
import { splitClasses } from "../utils/tailwind";
import { extractClassNameValues } from "./extract-classnames";

export function extractJsxUsages(ast: File, filePath: string): JsxUsage[] {
  const usages: JsxUsage[] = [];
  walkJsx(ast, filePath, usages, 0);
  return usages;
}

function walkJsx(node: unknown, filePath: string, usages: JsxUsage[], depth: number): void {
  if (!isRecord(node)) return;

  if (node.type === "JSXElement") {
    const opening = isRecord(node.openingElement) ? node.openingElement : undefined;
    const className = opening ? getClassName(opening) : undefined;
    const classes = className ? splitClasses(className) : [];

    usages.push({
      elementName: opening ? getJsxName(opening.name) ?? "unknown" : "unknown",
      classes,
      className,
      filePath,
      line: opening ? getLine(opening) : undefined,
      column: opening ? getColumn(opening) : undefined,
      depth,
      text: collectText(node),
    });

    for (const child of getArray(node.children)) {
      walkJsx(child, filePath, usages, depth + 1);
    }

    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (shouldSkipKey(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) walkJsx(item, filePath, usages, depth);
      }
    } else if (isAstNode(value)) {
      walkJsx(value, filePath, usages, depth);
    }
  }
}

function getClassName(openingElement: Record<string, unknown>): string | undefined {
  const attributes = getArray(openingElement.attributes);

  for (const attribute of attributes) {
    if (!isRecord(attribute) || attribute.type !== "JSXAttribute") continue;
    if (!isRecord(attribute.name) || attribute.name.name !== "className") continue;
    return extractClassNameValues(attribute.value).join(" ").trim() || undefined;
  }

  return undefined;
}

function collectText(node: unknown): string {
  if (!isRecord(node)) return "";

  if (node.type === "JSXElement") {
    return getArray(node.children)
      .map((child) => collectText(child))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (node.type === "JSXExpressionContainer") {
    return collectText(node.expression);
  }

  if (node.type === "JSXText" && typeof node.value === "string") {
    return node.value;
  }

  if (node.type === "StringLiteral" && typeof node.value === "string") {
    return node.value;
  }

  if (node.type === "TemplateLiteral") {
    return getArray(node.quasis)
      .map((quasi) => {
        if (!isRecord(quasi) || !isRecord(quasi.value)) return "";
        return typeof quasi.value.cooked === "string" ? quasi.value.cooked : "";
      })
      .join(" ");
  }

  let text = "";
  for (const [key, value] of Object.entries(node)) {
    if (shouldSkipKey(key)) continue;

    if (Array.isArray(value)) {
      text += ` ${value.map((item) => collectText(item)).join(" ")}`;
    } else if (isAstNode(value)) {
      text += ` ${collectText(value)}`;
    }
  }

  return text.replace(/\s+/g, " ").trim();
}

function getJsxName(node: unknown): string | undefined {
  if (!isRecord(node)) return undefined;
  if (node.type === "JSXIdentifier" && typeof node.name === "string") return node.name;
  if (node.type === "JSXMemberExpression") {
    const objectName = getJsxName(node.object);
    const propertyName = getJsxName(node.property);
    return [objectName, propertyName].filter(Boolean).join(".");
  }
  return undefined;
}

function getLine(node: Record<string, unknown>): number | undefined {
  return isRecord(node.loc) && isRecord(node.loc.start) && typeof node.loc.start.line === "number"
    ? node.loc.start.line
    : undefined;
}

function getColumn(node: Record<string, unknown>): number | undefined {
  return isRecord(node.loc) && isRecord(node.loc.start) && typeof node.loc.start.column === "number"
    ? node.loc.start.column + 1
    : undefined;
}

function shouldSkipKey(key: string): boolean {
  return [
    "loc",
    "start",
    "end",
    "extra",
    "leadingComments",
    "trailingComments",
    "innerComments",
  ].includes(key);
}

function isAstNode(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.type === "string";
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
