import clone from "clone";
import BaseConverter from "./base-converter";
import { nodesEqual, isNode, getChildKeys, escapeString, getNodeRange } from "../utils";

class FindAndReplaceConverter<T> extends BaseConverter<T> {
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
    this.buildDeletePattern(firstInputNode, this.deleteResults, this.builderNode);
    this.buildInsertPattern(this.insertResults, this.builderNode);
  }

  /**
   *
   * @param outputNode {Node | Node[]}
   * @param inputNode {Node | Node[]}
   * @param key {string}
   * @returns {boolean} if replace the whole node
   */
  private replaceChildNode(inputNode: T | T[], outputNode: T | T[], key?: string): boolean {
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
          if (nodesEqual(inputChildNode, outputChildNode, this.nodeQueryAdapter())) {
            return false;
          }
          if (this.nodeQueryAdapter().getNodeType(inputChildNode) !== this.nodeQueryAdapter().getNodeType(outputChildNode)) {
            this.addReplaceResult(replaceKey, outputChildNode);
            return true;
          }
        }
        return this.replaceChildNode(inputChildNode, outputChildNode, replaceKey);
      });
      return allChildrenReplaced.every(replaced => replaced);
    } else if (isNode(inputNode) && isNode(outputNode) && this.nodeQueryAdapter().getNodeType(inputNode) === this.nodeQueryAdapter().getNodeType(outputNode)) {
      const allChildrenReplaced = getChildKeys(inputNode, this.nodeQueryAdapter()).map(childKey => {
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
          if (nodesEqual(inputChildNode as T, outputChildNode as T, this.nodeQueryAdapter())) {
            return false;
          }
          if (this.nodeQueryAdapter().getNodeType(inputChildNode as T) !== this.nodeQueryAdapter().getNodeType(outputChildNode as T)) {
            this.addReplaceResult(replaceKey, outputChildNode as T);
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

  private addReplaceResult(key: string, outputChildNode: T[] | T | string) {
    if (Array.isArray(outputChildNode)) {
      const newCode = outputChildNode.map((childNode) => {
        const replacedNode = this.replaceNode(clone(childNode), this.inputNodes[0], getNodeRange(childNode, this.nodeMutationAdapter()).start);
        return this.generateSourceCode(replacedNode);
      }).join(", ")
      if (key === "members" && newCode === "") {
        return;
      }
      this.replaceResults.push({ key, newCode });
    } else if (typeof outputChildNode === "string") {
      this.replaceResults.push({ key, newCode: outputChildNode });
    } else if (isNode(outputChildNode)) {
      const replacedNode = this.replaceNode(clone(outputChildNode), this.inputNodes[0], getNodeRange(outputChildNode, this.nodeMutationAdapter()).start);
      const newCode = this.generateSourceCode(replacedNode);
      this.replaceResults.push({ key, newCode });
    }
  }
}

export default FindAndReplaceConverter;