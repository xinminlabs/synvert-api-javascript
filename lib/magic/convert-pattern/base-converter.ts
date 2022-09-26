import { Node } from "typescript";
import { BuilderNode } from "../builder";
import  FakeNode from "../fake-node";
import { getNodeType, nodesEqual, isNode, getNodeRange, getChildKeys, getSource } from "../utils";

class BaseConverter {
  constructor(protected inputNodes: Node[], protected outputNodes: Node[], protected builderNode: BuilderNode) {}

  /**
   * Replace matching nodes in replacedNode (usually outputNode).
   * It will iterate all child in inputNode, and try to replace the outputNode with the input node key.
   * @param replacedNode {Node|FakeNode} node to be replaced
   * @param inputNode {Node|Node[]} input node
   * @param startPosition {number} start position for fake node range
   * @param key {string} node key to reach replacedNode from outputNode
   * @returns node that has already been replaced
   */
  protected replaceNode(replacedNode: Node | FakeNode, inputNode: Node | Node[], startPosition: number = 0, key?: string): Node | FakeNode {
    if (Array.isArray(inputNode)) {
      inputNode.forEach((inputChildNode, index) => {
        if (!(replacedNode instanceof FakeNode)) {
          const replaceKey = key ? `${key}.${index}` : index.toString();
          let [found, result] = this.findAndReplaceWith(replacedNode, inputChildNode, startPosition, replaceKey);
          if (found) {
            while (found) {
              replacedNode = result;
              [found, result] = this.findAndReplaceWith(replacedNode as Node, inputChildNode, startPosition, replaceKey);
            }
          } else {
            replacedNode = this.replaceNode(replacedNode, inputChildNode, startPosition, replaceKey);
          }
        }
      });
    } else if (isNode(inputNode)) {
      getChildKeys(getNodeType(inputNode)).forEach(childKey => {
        if (!(replacedNode instanceof FakeNode) && inputNode[childKey]) {
          const replaceKey = key ? `${key}.${childKey}` : childKey;
          let [found, result] = this.findAndReplaceWith(replacedNode, inputNode[childKey], startPosition, replaceKey);
          if (found) {
            while (found) {
              replacedNode = result;
              [found, result] = this.findAndReplaceWith(replacedNode as Node, inputNode[childKey], startPosition, replaceKey);
            }
          } else {
            replacedNode = this.replaceNode(replacedNode, inputNode[childKey], startPosition, replaceKey);
          }
        }
      });
    }
    return replacedNode;
  }

  /**
   * Find target node in the children of the node and replace the target node with fake node.
   * @param node {Node} the node
   * @param targetNode {Node} target Node
   * @param startPosition {number} start position for fake node range
   * @param fakeNodeName {string} fake node name
   * @returns {[boolean, FakeNode|Node|null]} [found, replaced node]
   */
  protected findAndReplaceWith(node: Node, targetNode: Node, startPosition: number, fakeNodeName: string): [boolean, FakeNode | Node | null] {
    const fakeNode = new FakeNode(`{{${fakeNodeName}}}`);
    if (nodesEqual(node, targetNode)) {
      const range = getNodeRange(targetNode);
      fakeNode.range = { start: range.start - startPosition, end: range.end - startPosition };
      return [true, fakeNode];
    }
    const names = this.findNames(node, targetNode)
    if (names.length > 0) {
      return [true, this.deepUpdated(node, names, fakeNode, startPosition)];
    }
    return [false, null];
  }

  /**
   * Find the target node in the node, and return the names of the node to reach target node.
   * @example
   * The source code of the node is `$.isArray(foo, bar)`,
   * and the soruce code of the target node is `bar`,
   * then `findNames(node, targetNode)` is `["arguments", "1"]`
   * @param node {Node | Node[]} the node
   * @param targetNode {Node} the target node
   * @returns {string[]} the names to reach target node
   */
  protected findNames(node: Node | Node[], targetNode: Node): string[] {
    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index++) {
        if (nodesEqual(node[index], targetNode)) {
          return [String(index)];
        }
        const childNames = this.findNames(node[index], targetNode);
        if (childNames.length > 0) {
          return [index.toString(), ...childNames];
        }
      };
      return [];
    }

    if (!isNode(node)) {
      return [];
    }

    for (let key of getChildKeys(getNodeType(node))) {
      if (nodesEqual(node[key], targetNode)) {
        return [key];
      }

      const childNames = this.findNames(node[key], targetNode);
      if (childNames.length > 0) {
        return [key, ...childNames];
      }
    };
    return [];
  }

  /**
   * Replace target node with fake node, target node is reached from node by names.
   * @param node {Node} the node
   * @param names {stirng[]} names to reach target node
   * @param fakeNode {FakeNode} fake node
   * @param startPosition {number} start position for fake node range
   * @returns {Node} the node with replaced fake node
   */
  protected deepUpdated(node: Node, names: string[], fakeNode: FakeNode, startPosition: number): Node {
    const name = names.shift();
    if (names.length == 0) {
      const range = getNodeRange(node[name]);
      fakeNode.range = { start: range.start - startPosition, end: range.end - startPosition };
      node[name] = fakeNode;
    } else {
      node[name] = this.deepUpdated(node[name], names, fakeNode, startPosition);
    }
    return node;
  }

  /**
   * Generate the source code, replace the FakeNode with `{{name}}`
   * @param node {Node|FakeNode} the node
   * @returns {string} the source code
   */
   protected generateSourceCode(node: Node | FakeNode): string {
    if (node instanceof FakeNode) {
      return node.name;
    }

    let sourceCode = getSource(node);
    this.getAllFakeNodes(node).reverse().forEach(fakeNode => {
      sourceCode = sourceCode.substring(0, fakeNode.range.start) + fakeNode.name + sourceCode.substring(fakeNode.range.end);
    });
    return sourceCode;
  }

  /**
   * Get all fake nodes from the children of the node.
   * @param node {Node|FakeNode} the node
   * @returns {FakeNode[]} all fake nodes
   */
  protected getAllFakeNodes(node: Node | FakeNode): FakeNode[] {
    const fakeNodes = [];
    if (node instanceof FakeNode) {
      fakeNodes.push(node);
    } else {
      node.forEachChild(childNode => {
        fakeNodes.push(...this.getAllFakeNodes(childNode));
      })
    }
    return fakeNodes;
  }
}

export default BaseConverter;