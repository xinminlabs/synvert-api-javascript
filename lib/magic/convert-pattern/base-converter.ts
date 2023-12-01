import NodeQuery from "@xinminlabs/node-query";
import NodeMutation from "@xinminlabs/node-mutation";
import { BuilderNode } from "../builder";
import  FakeNode from "../fake-node";
import { nodesEqual, isNode, getNodeRange, getChildKeys, getNodeSource, escapeString, getNodeType } from "../utils";
import type { InsertResult, ReplaceResult } from "../../types";

const PROPERTY_NAMES = {
  Property: "Property",
  PropertyAssignment: "Property",
  JsxAttribute: "Attribute",
  JSXAttribute: "Attribute",
}

const PROPERTY_KEY_NAMES = {
  Property: "key",
  PropertyAssignment: "name",
  JSXAttribute: "name",
  JsxAttribute: "name",
}

class BaseConverter<T> {
  protected insertResults: InsertResult[] = [];
  protected deleteResults: (string | string[])[] = [];
  protected replaceResults: ReplaceResult[] = [];

  constructor(protected inputNodes: T[], protected outputNodes: T[], protected builderNode: BuilderNode, protected name?: string) {}

  private addInsertResult({ parentNode, outputChildNode, key, at }: { parentNode: T, outputChildNode: T, key: string, at: "beginning" | "end" }) {
    const parentKeys = key.split(".");
    const lastKey = parentKeys.pop();
    const index = getChildKeys(parentNode).indexOf(lastKey);
    let newKey = lastKey;
    if (at === "beginning") {
      getChildKeys(parentNode).slice(index).forEach(childKey => {
        if (parentNode[childKey]) {
          newKey = childKey;
          return;
        }
      });
    } else {
      getChildKeys(parentNode).slice(0, index).reverse().forEach(childKey => {
        if (parentNode[childKey]) {
          newKey = childKey;
          return;
        }
      });
    }
    const toKey = [...parentKeys, newKey].join(".");
    this.addRawInsertResult({ to: toKey, at, newNode: outputChildNode });
  }

  private addRawInsertResult({ to, at, newNode }: { to: string, at: "beginning" | "end", newNode: T }) {
    this.insertResults.push({ to, at, newCode: getNodeSource(newNode) });
  }

  private addDeleteResult(node: T, key: string) {
    if (Object.keys(PROPERTY_NAMES).includes(getNodeType(node))) {
      const propertyKey = key.split(".").slice(0, -2).join(".") + `.${getNodeSource((node as any)[PROPERTY_KEY_NAMES[getNodeType(node)]])}${PROPERTY_NAMES[getNodeType(node)]}`;
      if (this.deleteResults.length === 0) {
        this.deleteResults.push([propertyKey]);
        this.deleteResults.push([key]);
      } else {
        const duplicatedDeleteResults = [...this.deleteResults];
        duplicatedDeleteResults.forEach((deleteResult: string[]) => deleteResult.push(key));
        this.deleteResults.forEach((deleteResult: string[]) => deleteResult.push(propertyKey));
        this.deleteResults = [...this.deleteResults, ...duplicatedDeleteResults];
      }
    } else {
      if (this.deleteResults.length === 0) {
        this.deleteResults = [key];
      } else {
        this.deleteResults.push(key);
      }
    }
  }

  private arrayIndex(arrayNode: T[], index: number) {
    if (index === 0) {
      return 0;
    }
    if (index === arrayNode.length - 1) {
      return -1;
    }

    return index;
  }

  private iterateArray(inputNodes: T[], outputNodes: T[], key?: string) {
    if (inputNodes.length === 0 && outputNodes.length !== 0) {
      this.addRawInsertResult({ to: key, at: "beginning", newNode: outputNodes[0] });
      return;
    }

    if (inputNodes.length === outputNodes.length) {
      inputNodes.forEach((inputNode, index) => {
        index = this.arrayIndex(outputNodes, index);
        this.iterateNodes(inputNode, outputNodes[index], `${key}.${index}`);
      });
      return
    }

    if (inputNodes.length < outputNodes.length) {
      const insertIndices: { outputIndex: number, inputIndex: number }[] = [];
      let inputIndex = 0;
      let outputIndex = 0;
      while (true) {
        if (outputIndex >= outputNodes.length) {
          break;
        }

        if (outputNodes[outputIndex] && inputNodes[inputIndex] && nodesEqual(outputNodes[outputIndex], inputNodes[inputIndex])) {
          outputIndex++;
          inputIndex++;
          continue;
        }
        insertIndices.push({ outputIndex, inputIndex });
        outputIndex++;
      }

      if (insertIndices.length === outputNodes.length - inputNodes.length) {
        insertIndices.forEach(({ outputIndex, inputIndex }) => {
          const index = inputIndex === inputNodes.length? -1 : inputIndex;
          this.addRawInsertResult({
            to: key ? `${key}.${index}` : index.toString(),
            at: index === -1 ? "end" : "beginning",
            newNode: outputNodes[outputIndex],
          });
        });
      }
    }

    if (inputNodes.length > outputNodes.length) {
      let inputIndex = 0;
      let outputIndex = 0;
      while (true) {
        if (inputIndex >= inputNodes.length || outputIndex > outputNodes.length) {
          break;
        }

        if (inputNodes[inputIndex] && outputNodes[outputIndex] && nodesEqual(inputNodes[inputIndex], outputNodes[outputIndex])) {
          inputIndex++;
          outputIndex++;
          continue;
        }
        const index = this.arrayIndex(inputNodes, inputIndex);
        this.addDeleteResult(inputNodes[inputIndex], key ? `${key}.${index}` : index.toString());
        inputIndex++;
      }
    }
  }

  protected iterateNodes(inputNode: T | T[], outputNode: T | T[], key?: string) {
    if (Array.isArray(inputNode) && Array.isArray(outputNode)) {
      this.iterateArray(inputNode, outputNode, key);
      return;
    }

    if (isNode(inputNode) && isNode(outputNode)) {
      // FIXME: iterate hash
      if (NodeQuery.getAdapter().getNodeType(inputNode) === NodeQuery.getAdapter().getNodeType(outputNode)) {
        getChildKeys(inputNode).forEach(childKey => {
          if (nodesEqual(inputNode[childKey], outputNode[childKey])) {
            return;
          }

          const newKey = key ? `${key}.${childKey}` : childKey;
          if (!inputNode[childKey] && outputNode[childKey]) {
            this.addInsertResult({
              parentNode: inputNode,
              outputChildNode: outputNode[childKey] as T,
              key: newKey,
              at: "beginning",
            });
            return;
          }
          if (!outputNode[childKey] && inputNode[childKey]) {
            this.addDeleteResult(inputNode[childKey], newKey);
            return;
          }
          this.iterateNodes(inputNode[childKey], outputNode[childKey], newKey);
        });
      }
    }
  }

  /**
   * Replace matching nodes in replacedNode (usually outputNode).
   * It will iterate all child in inputNode, and try to replace the outputNode with the input node key.
   * @param replacedNode {Node|FakeNode} node to be replaced
   * @param inputNode {Node|Node[]} input node
   * @param startPosition {number} start position for fake node range
   * @param key {string} node key to reach replacedNode from outputNode
   * @returns node that has already been replaced
   */
  protected replaceNode(replacedNode: T | FakeNode, inputNode: T | T[], startPosition: number = 0, key?: string): T | FakeNode {
    if (Array.isArray(inputNode)) {
      inputNode.forEach((inputChildNode, index) => {
        if (!(replacedNode instanceof FakeNode)) {
          const replaceKey = key ? `${key}.${index}` : index.toString();
          let [found, result] = this.findAndReplaceWith(replacedNode, inputChildNode, startPosition, replaceKey);
          if (found) {
            while (found) {
              replacedNode = result;
              [found, result] = this.findAndReplaceWith(replacedNode as T, inputChildNode, startPosition, replaceKey);
            }
          } else {
            replacedNode = this.replaceNode(replacedNode, inputChildNode, startPosition, replaceKey);
          }
        }
      });
    } else if (isNode(inputNode)) {
      getChildKeys(inputNode).forEach(childKey => {
        if (!(replacedNode instanceof FakeNode) && inputNode[childKey]) {
          const replaceKey = key ? `${key}.${childKey}` : childKey;
          let [found, result] = this.findAndReplaceWith(replacedNode, inputNode[childKey], startPosition, replaceKey);
          if (found) {
            while (found) {
              replacedNode = result;
              [found, result] = this.findAndReplaceWith(replacedNode as T, inputNode[childKey], startPosition, replaceKey);
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
  protected findAndReplaceWith(node: T, targetNode: T, startPosition: number, fakeNodeName: string): [boolean, FakeNode | T | null] {
    const fakeNode = new FakeNode(fakeNodeName);
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
   * and the source code of the target node is `bar`,
   * then `findNames(node, targetNode)` is `["arguments", "1"]`
   * @param node {Node | Node[]} the node
   * @param targetNode {Node} the target node
   * @returns {string[]} the names to reach target node
   */
  protected findNames(node: T | T[], targetNode: T): string[] {
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

    for (let key of getChildKeys(node)) {
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
   * @param names {string[]} names to reach target node
   * @param fakeNode {FakeNode} fake node
   * @param startPosition {number} start position for fake node range
   * @returns {Node} the node with replaced fake node
   */
  protected deepUpdated(node: T, names: string[], fakeNode: FakeNode, startPosition: number): T {
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
   protected generateSourceCode(node: T | FakeNode): string {
    if (node instanceof FakeNode) {
      return node.toString();
    }

    let sourceCode = getNodeSource(node);
    this.getAllFakeNodes(node).reverse().forEach(fakeNode => {
      sourceCode = sourceCode.substring(0, fakeNode.range.start) + fakeNode.toString() + sourceCode.substring(fakeNode.range.end);
    });
    return sourceCode;
  }

  /**
   * Get all fake nodes from the children of the node.
   * @param node {Node|FakeNode} the node
   * @returns {FakeNode[]} all fake nodes
   */
  protected getAllFakeNodes(node: T | FakeNode): FakeNode[] {
    const fakeNodes = [];
    if (node instanceof FakeNode) {
      fakeNodes.push(node);
    } else {
      NodeQuery.getAdapter().getChildren(node).forEach(childNode => {
        fakeNodes.push(...this.getAllFakeNodes(childNode));
      });
    }
    return fakeNodes;
  }

  protected buildDeletePattern(node: T, keys: (string | string[])[], builderNode: BuilderNode) {
    if (keys.length === 0) {
      return;
    }

    this.composeDeleteKeys(keys).forEach(key => {
      builderNode.addSelective((selectiveNode) => {
        if (Array.isArray(key)) {
          this.buildMultipleKeysDeletePattern(node, key, selectiveNode);
        } else {
          this.buildSingleKeyDeletePattern(node, key, selectiveNode);
        }
      });
    });
  }

  private composeDeleteKeys(keys: (string | string[])[]) {
    const newKeys: (string | string[])[] = [keys[0]];
    let lastParentKey = "";
    keys.slice(1).forEach((key) => {
      if (Array.isArray(key)) {
        newKeys.push(key);
        lastParentKey = "";
      } else {
        const parentKey = this.getParentKey(key);
        if (lastParentKey.length > 0 && lastParentKey === parentKey) {
          newKeys[newKeys.length - 1] = [...newKeys[newKeys.length - 1], key];
        } else {
          newKeys.push(key);
        }
      lastParentKey = parentKey;
      }
    });
    return newKeys;
  }

  private buildSingleKeyDeletePattern(node: T, key: string, builderNode: BuilderNode) {
    let nodeType;
    if (key.includes(".")) {
      nodeType = getNodeType(NodeMutation.getAdapter().childNodeValue(node, this.getParentKey(key)));
    } else {
      nodeType = getNodeType(node);
    }
    if (nodeType === "PropertyAssignment" && key === "initializer") {
      builderNode.addConvertPattern('delete(["semicolon", "initializer"]);');
    } else if (nodeType === "Property" && key === "value") {
      builderNode.addConvertPattern('delete(["semicolon", "value"]);');
    } else {
      const jsx = NodeQuery.getAdapter().getNodeType(node).toLowerCase().startsWith("jsx");
      const andComma = !jsx && /((-?\d)|(Property)|(Initializer)|(Value))$/.test(
        key.split(".").at(-1)
      );
      const andSpace = jsx && /((-?\d)|Attribute)$/.test(
        key.split(".").at(-1)
      );
      builderNode.addConvertPattern(this.buildDeletePatternString(key, andComma, andSpace));
    }
  }

  private buildMultipleKeysDeletePattern(node: T, keys: string[], builderNode: BuilderNode) {
    if (this.keysHaveCommonParentKey(keys)) {
      const jsx = NodeQuery.getAdapter().getNodeType(node).toLowerCase().startsWith("jsx");
      const andComma = !jsx && /((-?\d)|(Property))$/.test(
        keys.at(-1).split(".").at(-1)
      );
      const andSpace = jsx && /((-?\d)|Attribute)$/.test(
        keys.at(-1).split(".").at(-1)
      );
      builderNode.addConvertPattern(this.buildDeletePatternString(keys, andComma, andSpace));
    } else {
      keys.forEach((key) => {
        this.buildSingleKeyDeletePattern(node, key, builderNode);
      });
    }
  }

  private buildDeletePatternString(keys: string | string[], andComma?: boolean, andSpace?: boolean): string {
    let keyString;
    if (Array.isArray(keys)) {
      keyString = `"${keys.join('", "')}"`;
    } else {
      keyString = escapeString(keys);
    }
    const options = [];
    if (andComma) {
      options.push("andComma: true");
    }
    if (andSpace) {
      options.push("andSpace: true");
    }
    if (options.length > 0) {
      return `delete(${keyString}, { ${options.join(", ")} });`;
    } else {
      return `delete(${keyString});`
    }
  }

  private keysHaveCommonParentKey(keys: string[]): boolean {
    return new Set(keys.map((key) => this.getParentKey(key))).size === 1;
  }

  private getParentKey(key: string): string {
    return key.split(".").slice(0, -1).join(".");
  }

  protected buildInsertPattern(insertResults: InsertResult[], builderNode: BuilderNode) {
    if (insertResults.length === 0) {
      return;
    }

    const jsx = NodeQuery.getAdapter().getNodeType(this.inputNodes[0]).toLowerCase().startsWith("jsx");
    const newline = NodeMutation.getAdapter().getEndLoc(this.inputNodes[0]).line !== NodeMutation.getAdapter().getEndLoc(this.outputNodes[0]).line;
    this.combineInsertResults(insertResults).forEach(result => {
      const to = result["to"];
      const lastKey = to.split(".").pop();
      const andComma = !jsx && /-?\d/.test(lastKey);
      const andSpace = jsx && /-?\d/.test(lastKey);
      // FIXME: replace code?
      const newCode = result["newCode"];
      const at = result["at"];
      let action;
      if (newline) {
        action = at == "beginning" ? "insertBefore" : "insertAfter";
      } else {
        action = "insert";
      }
      builderNode.addConvertPattern(
        `${action}(${escapeString(newCode)}, ${this.buildInsertOptionsString({ to, at, andComma, andSpace })});`
      )
    });
  }

  private buildInsertOptionsString(options: { at?: string, to?: string, andComma?: boolean, andSpace?: boolean }): string {
    const results = [];
    if (options.to) results.push(`to: "${options.to}"`);
    if (options.at) results.push(`at: "${options.at}"`);
    if (options.andComma) results.push(`andComma: ${options.andComma}`);
    if (options.andSpace) results.push(`andSpace: ${options.andSpace}`);
    return `{ ${results.join(", ")} }`;
  }

  private combineInsertResults(insertResults: InsertResult[]): InsertResult[] {
    return insertResults.reduce((newResults, result) => {
      if (result.to === newResults[newResults.length - 1]?.to && result.at === newResults[newResults.length - 1]?.at) {
        newResults[newResults.length - 1].newCode += result.newCode;
      } else {
        newResults.push(result);
      }
      return newResults;
    }, []);
  }
}

export default BaseConverter;