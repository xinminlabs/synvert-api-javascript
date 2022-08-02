import { Node, SyntaxKind } from "typescript";
import { ConvertPatternOptions } from "./types";
import Builder, { BuilderNode } from "./builder";
import { allArrays, allEqual, allNodes, allNodesEqual, allNodeTypeEqual, getNodeType, isNode, visitorKeys } from "./utils";

class FindPattern {
  constructor(private inputNodes: Node[], private outputNodes: Node[], private convertFunc: (ConvertPatternOptions) => void) {}

  call(): string[] {
    if (!allNodeTypeEqual(this.inputNodes)) {
      throw new Error("Input node types are not same");
    }
    if (!allNodeTypeEqual(this.outputNodes)) {
      throw new Error("Output node types are not same");
    }

    return Builder.build((rootNode: BuilderNode) => {
      this.nodesPattern(this.inputNodes, this.outputNodes, rootNode);
    });
  }

  private nodesPattern(inputNodes: Node[], outputNodes: Node[], builderNode: BuilderNode): void {
    const patterns = this.generatePatterns(inputNodes);
    builderNode.addWithFindPattern(patterns, (findPatternNode) => {
      findPatternNode.addSelective((selectiveNode) => {
        this.convertFunc.call(this, {
          inputNodes,
          outputNodes,
          builderNode: selectiveNode,
          converterType: "findAndReplace",
        });
      });
    });
  }

  private generatePatterns(nodes: Node[]): any {
    if (!allNodeTypeEqual(nodes)) {
      return null;
    }
    if (allNodesEqual(nodes)) {
      return this.valueInPattern(nodes[0]);
    }

    const nodeType = getNodeType(nodes[0]);
    const pattern = { type: nodeType };
    visitorKeys[nodeType].forEach(key => {
      const values = nodes.map(node => node[key]);
      if (allEqual(values)) {
        pattern[key] = this.valueInPattern(values[0]);
      } else if (allNodes(values) && allNodeTypeEqual(values)) {
        pattern[key] = this.generatePatterns(values);
      } else if (allArrays(values) && allEqual(values.map(value => value.length))) {
        pattern[key] = { length: values[0].length };
        for (let index = 0; index++; index < values[0].length) {
          pattern[key][index] = this.generatePatterns(values.map(value => value[index]));
        }
      }
    });
    return pattern;
  }

  private valueInPattern(value: Node | Node[]): any {
    if (isNode(value)) {
      switch (value.kind) {
        case SyntaxKind.Identifier:
          return value.getFullText();
        default:
          const inputType = getNodeType(value);
          const result = { type: inputType };
          visitorKeys[inputType].forEach(key => {
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