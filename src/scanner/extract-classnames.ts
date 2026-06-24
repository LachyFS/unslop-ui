import type { File } from "@babel/types";
import type { ClassNameUsage } from "../core/types";
import { isLikelyClassList, splitClasses } from "../utils/tailwind";

const CLASS_HELPERS = new Set([
  "cn",
  "clsx",
  "classnames",
  "cva",
  "cx",
  "tv",
  "twJoin",
  "twMerge",
]);

export function extractClassNameUsages(ast: File, filePath: string): ClassNameUsage[] {
  const usages: ClassNameUsage[] = [];
  const seen = new Set<string>();

  walk(ast, { inClassContext: false }, (node, state) => {
    if (!isRecord(node)) return;
    const value = getStaticStringValue(node);
    if (!value) return;

    if (!isLikelyClassList(value, { allowSingleUtility: state.inClassContext })) return;
    const line = getLine(node);
    const column = getColumn(node);
    const key = `${line ?? "?"}:${column ?? "?"}:${value}`;
    if (seen.has(key)) return;
    seen.add(key);

    usages.push({
      value,
      classes: splitClasses(value),
      filePath,
      line,
      column,
      elementName: state.elementName,
    });
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
        return [...extractObjectKey(property.key), ...extractClassNameValues(property.value)];
      });
    case "BinaryExpression":
      if (node.operator !== "+") return [];
      return extractClassNameValues(node.left).concat(extractClassNameValues(node.right));
    default:
      return [];
  }
}

interface WalkState {
  inClassContext: boolean;
  elementName?: string;
}

function walk(node: unknown, state: WalkState, visitor: (node: unknown, state: WalkState) => void): void {
  if (!isRecord(node)) return;

  visitor(node, state);
  const childState = getChildState(node, state);

  for (const [key, value] of Object.entries(node)) {
    if (shouldSkipKey(key)) continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isAstNode(item)) walk(item, childState, visitor);
      }
    } else if (isAstNode(value)) {
      walk(value, childState, visitor);
    }
  }
}

function getChildState(node: Record<string, unknown>, state: WalkState): WalkState {
  const elementName =
    node.type === "JSXOpeningElement" ? getJsxName(node.name) : state.elementName;

  return {
    elementName,
    inClassContext:
      state.inClassContext ||
      isClassNameAttribute(node) ||
      isClassHelperCall(node) ||
      isTailwindTemplateTag(node),
  };
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

function getStaticStringValue(node: unknown): string | undefined {
  if (!isRecord(node)) return undefined;

  if (node.type === "StringLiteral" && typeof node.value === "string") {
    return node.value;
  }

  if (node.type === "TemplateElement" && isRecord(node.value)) {
    return typeof node.value.cooked === "string" ? node.value.cooked : undefined;
  }

  return undefined;
}

function getCalleeName(node: unknown): string | undefined {
  if (!isRecord(node)) return undefined;
  if (node.type === "Identifier" && typeof node.name === "string") return node.name;
  if (node.type === "MemberExpression" && isRecord(node.property)) {
    return typeof node.property.name === "string" ? node.property.name : undefined;
  }
  return undefined;
}

function isClassNameAttribute(node: Record<string, unknown>): boolean {
  return (
    node.type === "JSXAttribute" &&
    isRecord(node.name) &&
    (node.name.name === "className" || node.name.name === "class")
  );
}

function isClassHelperCall(node: Record<string, unknown>): boolean {
  const calleeName = getCalleeName(node.callee);
  return node.type === "CallExpression" && Boolean(calleeName && CLASS_HELPERS.has(calleeName));
}

function isTailwindTemplateTag(node: Record<string, unknown>): boolean {
  if (node.type !== "TaggedTemplateExpression") return false;
  return isTwTag(node.tag);
}

function isTwTag(node: unknown): boolean {
  if (!isRecord(node)) return false;
  if (node.type === "Identifier") return node.name === "tw";
  return (
    node.type === "MemberExpression" &&
    isRecord(node.object) &&
    node.object.type === "Identifier" &&
    node.object.name === "tw"
  );
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
