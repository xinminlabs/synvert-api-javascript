import clone from "clone";
import NodeQuery from "@xinminlabs/node-query";
import BaseConverter from "./base-converter";
import { BuilderNode } from "../builder";
import { nodesEqual, isNode, getChildKeys, escapeString, getNodeRange } from "../utils";
import type { GenericNode } from "../../types";

type ReplaceResult = {
  key: string
  newCode: string
}

class FindAndReplaceConverter extends BaseConverter {
  private replaceResults: ReplaceResult[];

  constructor(protected inputNodes: GenericNode[], protected outputNodes: GenericNode[], protected builderNode: BuilderNode) {
    super(inputNodes, outputNodes, builderNode);
    this.replaceResults = [];
  }

  call() {
    if (this.outputNodes.length === 0) {
      return;
    }

    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];

    this.replaceChildNode(firstInputNode, firstOutputNode);
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
  private replaceChildNode(inputNode: GenericNode | GenericNode[], outputNode: GenericNode | GenericNode[], key?: string): boolean {
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
          if (NodeQuery.getAdapter().getNodeType(inputChildNode) !== NodeQuery.getAdapter().getNodeType(outputChildNode)) {
            this.addReplaceResult(replaceKey, outputChildNode);
            return true;
          }
        }
        return this.replaceChildNode(inputChildNode, outputChildNode, replaceKey);
      });
      return allChildrenReplaced.every(replaced => replaced);
    } else if (isNode(inputNode) && isNode(outputNode) && NodeQuery.getAdapter().getNodeType(inputNode) === NodeQuery.getAdapter().getNodeType(outputNode)) {
      const allChildrenReplaced = getChildKeys(inputNode).map(childKey => {
        const inputChildNode = inputNode[childKey];
        const outputChildNode = outputNode[childKey];
        const replaceKey = key ? `${key}.${childKey}` : childKey;
        if ((!isNode(inputChildNode) && isNode(outputChildNode)) || (isNode(inputChildNode) && !isNode(outputChildNode))) {
          return true;
        }
        if (Array.isArray(inputChildNode) && Array.isArray(outputChildNode)) {
          if (this.replaceChildNode(inputChildNode, outputChildNode, replaceKey)) {
            this.addReplaceResult(replaceKey, outputChildNode);
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
          if (NodeQuery.getAdapter().getNodeType(inputChildNode) !== NodeQuery.getAdapter().getNodeType(outputChildNode)) {
            this.addReplaceResult(replaceKey, outputChildNode);
            return true;
          }
        }
        if (this.replaceChildNode(inputChildNode, outputChildNode, replaceKey)) {
          this.addReplaceResult(replaceKey, outputChildNode);
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

  private addReplaceResult(key: string, outputChildNode: GenericNode[] | GenericNode | string) {
    if (Array.isArray(outputChildNode)) {
      const newCode = outputChildNode.map((childNode) => {
        const replacedNode = this.replaceNode(clone(childNode), this.inputNodes[0], getNodeRange(childNode).start);
        return this.generateSourceCode(replacedNode);
      }).join(", ")
      this.replaceResults.push({ key, newCode });
    } else if (isNode(outputChildNode)) {
      const replacedNode = this.replaceNode(clone(outputChildNode), this.inputNodes[0], getNodeRange(outputChildNode).start);
      const newCode = this.generateSourceCode(replacedNode);
      this.replaceResults.push({ key, newCode });
    } else {
      this.replaceResults.push({ key, newCode: outputChildNode });
    }
  }
}

export default FindAndReplaceConverter;