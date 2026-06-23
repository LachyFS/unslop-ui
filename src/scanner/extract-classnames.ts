import type { File } from "@babel/types";
import type { ClassNameUsage } from "../core/types";
import { splitClasses } from "../utils/tailwind";

const CLASS_HELPERS = new Set(["cn", "clsx", "classnames", "cva"]);

export function extractClassNameUsages(ast: File, filePath: string): ClassNameUsage[] {
  const usages: ClassNameUsage[] = [];

  walk(ast, (node) => {
    if (!isRecord(node) || node.type !== "JSXOpeningElement") return;

    const elementName = getJsxName(node.name);
    const attributes = Array.isArray(node.attributes) ? node.attributes : [];

    for (const attribute of attributes) {
      if (!isRecord(attribute) || attribute.type !== "JSXAttribute") continue;
      if (!isRecord(attribute.name) || attribute.name.name !== "className") continue;

      const values = extractClassNameValues(attribute.value);
      for (const value of values) {
        const classes = splitClasses(value);
        if (classes.length === 0) continue;

        usages.push({
          value,
          classes,
          filePath,
          line: getLine(attribute),
          column: getColumn(attribute),
          elementName,
        });
      }
    }
  });

  return usages;
}

export function extractClassNameValues(node: unknown): string[] {
  if (!isRecord(node)) return [];

  switch (node.type) {
    case "StringLiteral":
      return typeof node.value === "string" ? [node.value] : [];
    case "JSXExpressionContainer":
      return extractClassNameValues(node.expression);
    case "TemplateLiteral":
      return [
        ...getTemplateQuasis(node),
        ...getArray(node.expressions).flatMap((expression) => extractClassNameValues(expression)),
      ];
    case "CallExpression": {
      const calleeName = getCalleeName(node.callee);
      if (!calleeName || !CLASS_HELPERS.has(calleeName)) return [];
      return getArray(node.arguments).flatMap((argument) => extractClassNameValues(argument));
    }
    case "ConditionalExpression":
      return [
        ...extractClassNameValues(node.consequent),
        ...extractClassNameValues(node.alternate),
      ];
    case "LogicalExpression":
      return extractClassNameValues(node.left).concat(extractClassNameValues(node.right));
    case "ArrayExpression":
      return getArray(node.elements).flatMap((element) => extractClassNameValues(element));
    case "ObjectExpression":
      return getArray(node.properties).flatMap((property) => {
        if (!isRecord(property) || property.type !== "ObjectProperty") return [];
        return extractObjectKey(property.key);
      });
    case "BinaryExpression":
      if (node.operator !== "+") return [];
      return extractClassNameValues(node.left).concat(extractClassNameValues(node.right));
    default:
      return [];
  }
}

function walk(node: unknown, visitor: (node: unknown) => void): void {
  if (!isRecord(node)) return;

  visitor(node);

  for (const [key, value] of Object.entries(node)) {
    if (shouldSkipKey(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) walk(item, visitor);
      }
    } else if (isAstNode(value)) {
      walk(value, visitor);
    }
  }
}

function extractObjectKey(node: unknown): string[] {
  if (!isRecord(node)) return [];
  if (node.type === "StringLiteral" && typeof node.value === "string") return [node.value];
  if (node.type === "Identifier" && typeof node.name === "string") return [node.name];
  return [];
}

function getTemplateQuasis(node: Record<string, unknown>): string[] {
  return getArray(node.quasis)
    .map((quasi) => {
      if (!isRecord(quasi) || !isRecord(quasi.value)) return "";
      return typeof quasi.value.cooked === "string" ? quasi.value.cooked : "";
    })
    .filter(Boolean);
}

function getCalleeName(node: unknown): string | undefined {
  if (!isRecord(node)) return undefined;
  if (node.type === "Identifier" && typeof node.name === "string") return node.name;
  if (node.type === "MemberExpression" && isRecord(node.property)) {
    return typeof node.property.name === "string" ? node.property.name : undefined;
  }
  return undefined;
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
