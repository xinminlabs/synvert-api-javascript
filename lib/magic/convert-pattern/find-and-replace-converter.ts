import { Node } from "typescript";
import BaseConverter from "./base-converter";
import { BuilderNode } from "../builder";
import { getNodeType, nodesEqual, isNode, getChildKeys, escapeString, getSource } from "../utils";

type ReplaceResult = {
  key: string
  newCode: string
}

class FindAndReplaceConverter extends BaseConverter {
  private replaceResults: ReplaceResult[];

  constructor(protected inputNodes: Node[], protected outputNodes: Node[], protected builderNode: BuilderNode) {
    super(inputNodes, outputNodes, builderNode);
    this.replaceResults = [];
  }

  call() {
    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];

    this.replaceNode(firstInputNode, firstOutputNode);
    const patterns = this.generateReplacePatterns();
    patterns.forEach(pattern => {
      this.builderNode.addConvertPattern(pattern);
    });
  }

  /**
   *
   * @param outputNode {Node | Node[]}
   * @param inputNode {Node | Node[]}
   * @param key {string}
   * @returns {boolean} if replace the whole node
   */
  private replaceNode(inputNode: Node | Node[], outputNode: Node | Node[], key?: string): boolean {
    if (Array.isArray(inputNode) && Array.isArray(outputNode)) {
      if (inputNode.length !== outputNode.length) {
        return true;
      }
      const allChildrenReplaced = inputNode.map((inputChildNode, index) => {
        const outputChildNode = outputNode[index];
        const replaceKey = key ? `${key}.${index}` : index.toString();
        if ((!isNode(inputChildNode) && isNode(outputChildNode)) || (isNode(inputChildNode) && !isNode(outputChildNode))) {
          return true;
        }
        if (!isNode(inputChildNode) && !isNode(outputChildNode)) {
          if (typeof inputChildNode === "undefined" && typeof outputChildNode === "undefined") {
            return true;
          }
          if (inputChildNode === outputChildNode) {
            return false;
          }
          this.addReplaceResult(replaceKey, outputChildNode);
          return true;
        }
        if (isNode(inputChildNode) && isNode(outputChildNode)) {
          if (nodesEqual(inputChildNode, outputChildNode)) {
            return false;
          }
          if (getChildKeys(getNodeType(inputChildNode)) !== getChildKeys(getNodeType(outputChildNode))) {
            this.addReplaceResult(replaceKey, getSource(outputChildNode));
            return true;
          }
        }
        return this.replaceNode(inputChildNode, outputChildNode, replaceKey);
      });
      return allChildrenReplaced.every(replaced => replaced);
    } else if (isNode(inputNode) && isNode(outputNode) && inputNode.kind === outputNode.kind) {
      const allChildrenReplaced = getChildKeys(getNodeType(inputNode)).map(childKey => {
        const inputChildNode = inputNode[childKey];
        const outputChildNode = outputNode[childKey];
        const replaceKey = key ? `${key}.${childKey}` : childKey;
        if ((!isNode(inputChildNode) && isNode(outputChildNode)) || (isNode(inputChildNode) && !isNode(outputChildNode))) {
          return true;
        }
        if (Array.isArray(inputChildNode) && Array.isArray(outputChildNode)) {
          if (this.replaceNode(inputChildNode, outputChildNode, replaceKey)) {
            this.addReplaceResult(replaceKey, outputChildNode.map(childNode => getSource(childNode)).join(", "));
            return true;
          }
          return false;
        }
        if (!isNode(inputChildNode) && !isNode(outputChildNode)) {
          if (typeof inputChildNode === "undefined" && typeof outputChildNode === "undefined") {
            return true;
          }
          if (inputChildNode === outputChildNode) {
            return false;
          }
          this.addReplaceResult(replaceKey, outputChildNode);
          return true;
        }
        if (isNode(inputChildNode) && isNode(outputChildNode)) {
          if (nodesEqual(inputChildNode, outputChildNode)) {
            return false;
          }
          if (getChildKeys(getNodeType(inputChildNode)) !== getChildKeys(getNodeType(outputChildNode))) {
            this.addReplaceResult(replaceKey, getSource(outputChildNode));
            return true;
          }
        }
        if (this.replaceNode(inputChildNode, outputChildNode, replaceKey)) {
          this.addReplaceResult(replaceKey, getSource(outputChildNode));
          return true;
        }
      });
      return allChildrenReplaced.every(replaced => replaced);
    }
  }

  /**
   * Generate replace patterns.
   * @example
   * if this.replaceResults are
   *     [
   *       { key: "arguments", newCode: '("foo", "bar")' },
   *       { key: "arguments.0", newCode: '"foo"' },
   *       { key: "arguments.1", newCode: '"bar"' },
   *       { key: "expression.expression", newCode: "$" },
   *       { key: "expression.name", newCode: "isArray" },
   *     ]
   * it will return
   *     [
   *       `replace("arguments", { with: \`("foo", "bar")\` })`,
   *       "replace(\"expression.expression\", { with: `$` })",
   *       "replace(\"expression.name\", { with: `isArray` })",
   *     ]
   * @returns {string[]} replace patterns
   */
  private generateReplacePatterns(): string[] {
    const patterns = [];
    let lastKey;
    this.replaceResults.sort((a, b) => a.key.localeCompare(b.key)).forEach(result => {
      if (lastKey && result.key.startsWith(lastKey)) {
        return;
      }
      patterns.push(`replace("${result.key}", { with: ${escapeString(result.newCode)} });`);
      lastKey = result.key;
    });
    return patterns;
  }

  private addReplaceResult(key: string, newCode: string) {
    this.replaceResults.push({ key, newCode });
  }
}

export default FindAndReplaceConverter;