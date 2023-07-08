import NodeQuery from "@xinminlabs/node-query";
import { ConvertPatternOptions, NqlOrRules } from "./types";
import Builder, { BuilderNode } from "./builder";
import { PATTERNS } from "./convert-pattern";
import { allArrays, allEqual, allNodes, allNodesEqual, allNodeTypeEqual, allUndefined, getChildKeys, getSource, isNode } from "./utils";
import InsertConverter from "./convert-pattern/insert-converter";
import type { GenericNode } from "../types";

class FindPattern {
  constructor(private inputNodes: GenericNode[], private outputNodes: GenericNode[], private nqlOrRules: NqlOrRules, private convertFunc: (ConvertPatternOptions) => void) {}

  call(): string[] {
    if (!allUndefined(this.inputNodes) && !allNodeTypeEqual(this.inputNodes)) {
      throw new Error("Input node types are not same");
    }
    if (!allUndefined(this.outputNodes) && !allNodeTypeEqual(this.outputNodes)) {
      throw new Error("Output node types are not same");
    }

    return Builder.build((rootNode: BuilderNode) => {
      this.nodesPattern(this.inputNodes, this.outputNodes, rootNode);
    });
  }

  private nodesPattern(inputNodes: GenericNode[], outputNodes: GenericNode[], builderNode: BuilderNode): void {
    let patterns = this.generatePatterns(inputNodes);
    if (typeof patterns === "string") {
      // if the input node is a simple Identifier
      patterns = { nodeType: "Identifier", escapedText: patterns };
    }
    if (inputNodes.every(node => typeof node === "undefined")) {
      new InsertConverter(inputNodes, outputNodes, builderNode).call();
      return;
    }

    if (this.nqlOrRules === NqlOrRules.nql) {
      builderNode.addFindNodeFindPattern(patterns, (findPatternNode) => {
        Object.keys(PATTERNS).forEach(converterType => {
          findPatternNode.addSelective((selectiveNode) => {
            this.convertFunc.call(this, {
              inputNodes,
              outputNodes,
              builderNode: selectiveNode,
              converterType,
            });
          });
        });
      });
    } else {
      builderNode.addWithNodeFindPattern(patterns, (findPatternNode) => {
        Object.keys(PATTERNS).forEach(converterType => {
          findPatternNode.addSelective((selectiveNode) => {
            this.convertFunc.call(this, {
              inputNodes,
              outputNodes,
              builderNode: selectiveNode,
              converterType,
            });
          });
        });
      });
    }
  }

  private generatePatterns(nodes: GenericNode[]): any {
    if (!allNodeTypeEqual(nodes)) {
      return null;
    }
    if (allNodesEqual(nodes)) {
      return this.valueInPattern(nodes[0]);
    }

    const nodeType = NodeQuery.getAdapter().getNodeType(nodes[0]);
    const pattern = { nodeType: nodeType };
    getChildKeys(nodes[0]).forEach(key => {
      const values = nodes.map(node => node[key]);
      if (allEqual(values)) {
        pattern[key] = this.valueInPattern(values[0]);
      } else if (allNodes(values) && allNodeTypeEqual(values)) {
        pattern[key] = this.generatePatterns(values);
      } else if (allArrays(values) && allEqual(values.map(value => value.length))) {
        pattern[key] = { length: values[0].length };
        for (let index = 0; index < values[0].length; index++) {
          pattern[key][index] = this.generatePatterns(values.map(value => value[index]));
        }
      }
    });
    return pattern;
  }

  private valueInPattern(value: GenericNode | GenericNode[]): any {
    if (isNode(value)) {
      switch (NodeQuery.getAdapter().getNodeType(value)) {
        case "Identifier":
        case "JsxText":
          return getSource(value);
        default:
          const inputType = NodeQuery.getAdapter().getNodeType(value);
          const result = { nodeType: inputType };
          getChildKeys(value).forEach(key => {
            result[key] = this.valueInPattern(value[key]);
          });
          return result;
      }
    } else if (Array.isArray(value)) {
      const result = { length: value.length };
      value.forEach((node, index) => { result[index] = this.valueInPattern(node) });
      return result;
    } else {
      return value;
    }
  }
}

export default FindPattern;
