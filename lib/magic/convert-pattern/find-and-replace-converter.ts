import { Node } from "typescript";
import { KEYS } from "typescript-visitor-keys";
import BaseConverter from "./base-converter";
import  FakeNode from "../fake-node";
import { getNodeType, nodesEqual, isNode } from "../utils";

class FindAndReplaceConverter extends BaseConverter {
  call() {
    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];

    const replacedNode = this.replaceNode(firstOutputNode, firstInputNode);
    const newStr = this.generateSourceCode(replacedNode);
    this.builderNode.addConvertPattern(`replaceWith("${newStr}");`);
  }

  private replaceNode(replacedNode: Node | FakeNode, inputNode: Node | Node[], key?: string): Node | FakeNode {
    if (Array.isArray(inputNode)) {
      inputNode.forEach((inputChildNode, index) => {
        if (!(replacedNode instanceof FakeNode)) {
          const replaceKey = key ? `${key}.${index}` : index.toString();
          const [found, result] = this.findAndReplace(replacedNode, inputChildNode, replaceKey);
          if (found) {
            replacedNode = result;
          } else {
            replacedNode = this.replaceNode(replacedNode, inputChildNode, replaceKey);
          }
        }
      });
    } else if (isNode(inputNode)) {
      KEYS[getNodeType(inputNode)].forEach(childKey => {
        if (!(replacedNode instanceof FakeNode) && inputNode[childKey]) {
          const replaceKey = key ? `${key}.${childKey}` : childKey;
          const [found, result] = this.findAndReplace(replacedNode, inputNode[childKey], replaceKey);
          if (found) {
            replacedNode = result;
          } else {
            replacedNode = this.replaceNode(replacedNode, inputNode[childKey], replaceKey);
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
   * @param fakeNodeName {string} fake node name
   * @returns {[boolean, FakeNode|Node|null]} [found, replaced node]
   */
  private findAndReplace(node: Node, targetNode: Node, fakeNodeName: string): [boolean, FakeNode | Node | null] {
    const fakeNode = new FakeNode(`{{${fakeNodeName}}}`);
    if (nodesEqual(node, targetNode)) {
      fakeNode.range = { start: targetNode.getFullStart(), end: targetNode.getEnd() };
      return [true, fakeNode];
    }
    const names = this.findNames(node, targetNode)
    if (names.length > 0) {
      return [true, this.deepUpdated(node, names, fakeNode)];
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
  private findNames(node: Node | Node[], targetNode: Node): string[] {
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

    for (let key of KEYS[getNodeType(node)]) {
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
   * @returns {Node} the node with replaced fake node
   */
  private deepUpdated(node: Node, names: string[], fakeNode: FakeNode): Node {
    const name = names.shift();
    if (names.length == 0) {
      fakeNode.range = { start: node[name].getFullStart(), end: node[name].getEnd() };
      node[name] = fakeNode;
    } else {
      node[name] = this.deepUpdated(node[name], names, fakeNode);
    }
    return node;
  }

  /**
   * Generate the source code, replace the FakeNode with `{{name}}`
   * @param node {Node|FakeNode} the node
   * @returns {string} the source code
   */
  private generateSourceCode(node: Node | FakeNode): string {
    if (node instanceof FakeNode) {
      return node.name;
    }

    let sourceCode = node.getFullText();
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
  private getAllFakeNodes(node: Node | FakeNode): FakeNode[] {
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

export default FindAndReplaceConverter;