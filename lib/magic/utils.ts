import { createSourceFile, Node, SyntaxKind, ScriptKind, ScriptTarget } from "typescript";

export const parseCode = (code: string): Node => {
  return createSourceFile("code.ts", code, ScriptTarget.Latest, true, ScriptKind.TS).statements[0];
}

export const getNodeType = (node: Node) => SyntaxKind[node.kind];

export const isNode = (value: any): value is Node => value && value instanceof Object && 'kind' in value;

export const allNodes = (values: any[]): boolean => values.every(value => isNode(value));

export const allArrays = (values: any[]): boolean => values.every(value => Array.isArray(value));

export const allEqual = (values: any[]): boolean => values.every(value => value === values[0]);

export const allNodeTypeEqual = (nodes: Node[]): boolean => nodes.every(node => isNode(node) && node.kind === nodes[0].kind);

export const allNodesEqual = (nodes: Node[]): boolean => nodes.every(node => nodesEqual(node, nodes[0]));

export const nodesEqual = (node1: Node, node2: Node): boolean => {
  if (!isNode(node1)) {
    return false;
  }
  if (!isNode(node2)) {
    return false;
  }
  if (node1.kind != node2.kind) {
    return false;
  }
  const nodeType = getNodeType(node1);
  if (nodeType === "Identifier") {
    return node1['escapedText'] === node2['escapedText'];
  } else {
    return visitorKeys[nodeType].every(key => valuesEqual(node1[key], node2[key]));
  }
}

const valuesEqual = (value1: any, value2: any): boolean => {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false;
    }
    return value1.every((v1, index) => {
      return valuesEqual(v1, value2[index]);
    })
  } else if (isNode(value1) && isNode(value2)) {
    return nodesEqual(value1, value2);
  } else {
    return value1 === value2;
  }
}

export const visitorKeys = {
  CallExpression: ['expression', 'typeArguments', 'arguments'],
  ClassDeclaration: ['members', 'name'],
  ExpressionStatement: ['expression'],
  Identifier: [],
  PropertyAccessExpression: ['expression', 'name'],
}