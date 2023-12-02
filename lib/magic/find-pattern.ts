import { Adapter as QueryAdapter, TypescriptAdapter as QueryTypescriptAdapter, EspreeAdapter as QueryEspreeAdapter, GonzalesPeAdapter as QueryGonzalesPeAdapter } from "@xinminlabs/node-query";
import { Adapter as MutationAdapter, TypescriptAdapter as MutationTypescriptAdapter, EspreeAdapter as MutationEspreeAdapter, GonzalesPeAdapter as MutationGonzalesPeAdapter } from "@xinminlabs/node-mutation";
import { ConvertPatternOptions, NqlOrRules } from "./types";
import Builder, { BuilderNode } from "./builder";
import { PATTERNS } from "./convert-pattern";
import { allArrays, allEqual, allNodes, allNodesEqual, allNodeTypeEqual, allUndefined, getChildKeys, getNodeSource, isNode } from "./utils";
import InsertConverter from "./convert-pattern/insert-converter";

class FindPattern<T> {
  constructor(private parser: string, private inputNodes: T[], private outputNodes: T[], private nqlOrRules: NqlOrRules, private convertFunc: (ConvertPatternOptions) => void) {}

  call(): string[] {
    if (this.inputNodes.every(node => node && this.nodeQueryAdapter().getNodeType(node) === "ExpressionStatement")) {
      this.inputNodes = this.inputNodes.map(node => node["expression"]);
    }
    if (this.outputNodes.every(node => node && this.nodeQueryAdapter().getNodeType(node) === "ExpressionStatement")) {
      this.outputNodes = this.outputNodes.map(node => node["expression"]);
    }
    if (this.inputNodes.every(node => node && this.nodeQueryAdapter().getNodeType(node) === "stylesheet")) {
      this.inputNodes = this.inputNodes.map(node => node["content"][0]);
    }
    if (this.outputNodes.every(node => node && this.nodeQueryAdapter().getNodeType(node) === "stylesheet")) {
      this.outputNodes = this.outputNodes.map(node => node["content"][0]);
    }
    if (!allUndefined(this.inputNodes) && !allNodeTypeEqual(this.inputNodes, this.nodeQueryAdapter())) {
      throw new Error("Input node types are not same");
    }
    if (!allUndefined(this.inputNodes) && !allNodeTypeEqual(this.inputNodes, this.nodeQueryAdapter())) {
      throw new Error("Output node types are not same");
    }

    return Builder.build((rootNode: BuilderNode) => {
      this.nodesPattern(this.inputNodes, this.outputNodes, rootNode);
    });
  }

  private nodesPattern(inputNodes: T[], outputNodes: T[], builderNode: BuilderNode): void {
    let patterns = this.generatePatterns(inputNodes);
    if (typeof patterns === "string") {
      // if the input node is a simple Identifier
      patterns = { nodeType: "Identifier", escapedText: patterns };
    }
    if (inputNodes.every(node => typeof node === "undefined")) {
      new InsertConverter(this.parser, inputNodes, outputNodes, builderNode).call();
      return;
    }

    if (this.nqlOrRules === NqlOrRules.nql) {
      builderNode.addFindNodeFindPattern(patterns, (findPatternNode) => {
        Object.keys(PATTERNS).forEach(converterType => {
          findPatternNode.addSelective((selectiveNode) => {
            this.convertFunc.call(this, {
              parser: this.parser,
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
              parser: this.parser,
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

  private generatePatterns(nodes: T[]): any {
    if (!allNodeTypeEqual(nodes, this.nodeQueryAdapter())) {
      return null;
    }
    if (allNodesEqual(nodes, this.nodeQueryAdapter())) {
      return this.valueInPattern(nodes[0]);
    }

    const nodeType = this.nodeQueryAdapter().getNodeType(nodes[0]);
    const pattern = { nodeType: nodeType };
    getChildKeys(nodes[0], this.nodeQueryAdapter()).forEach(key => {
      const values = nodes.map(node => node[key]);
      if (allEqual(values)) {
        pattern[key] = this.valueInPattern(values[0]);
      } else if (allNodes(values) && allNodeTypeEqual(values, this.nodeQueryAdapter())) {
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

  private valueInPattern(value: T | T[]): any {
    if (isNode(value)) {
      switch (this.nodeQueryAdapter().getNodeType(value)) {
        case "Identifier":
        case "JsxText":
          return getNodeSource(value, this.nodeQueryAdapter());
        default:
          const inputType = this.nodeQueryAdapter().getNodeType(value);
          const result = { nodeType: inputType };
          getChildKeys(value, this.nodeQueryAdapter()).forEach(key => {
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

  private nodeQueryAdapter() {
    switch (this.parser) {
      case "typescript":
        return new QueryTypescriptAdapter() as QueryAdapter<T>;
      case "espree":
        return new QueryEspreeAdapter() as QueryAdapter<T>;
      case "gonzales-pe":
        return new QueryGonzalesPeAdapter() as QueryAdapter<T>;
      default:
        throw new Error("Unknown node query parser");
    }
  }

  private nodeMutationAdapter() {
    switch (this.parser) {
      case "typescript":
        return new MutationTypescriptAdapter() as MutationAdapter<T>;
      case "espree":
        return new MutationEspreeAdapter() as MutationAdapter<T>;
      case "gonzales-pe":
        return new MutationGonzalesPeAdapter() as MutationAdapter<T>;
      default:
        throw new Error("Unknown node mutation parser");
    }
  }
}

export default FindPattern;
