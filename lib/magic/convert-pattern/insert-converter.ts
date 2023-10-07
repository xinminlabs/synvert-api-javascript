import NodeQuery from "@xinminlabs/node-query";
import NodeMutation from "@xinminlabs/node-mutation";
import BaseConverter from "./base-converter";
import { BuilderNode } from "../builder";
import { escapeString, getChildKeys, isNode, nodeIsNull, nodesEqual, getSource } from "../utils";
import type { GenericNode } from "../../types";

type InsertResult = {
  to: string,
  at: string,
  newCode: string
}

class InsertConverter extends BaseConverter {
  private insertResults: InsertResult[];

  constructor(protected inputNodes: GenericNode[], protected outputNodes: GenericNode[], protected builderNode: BuilderNode) {
    super(inputNodes, outputNodes, builderNode);
    this.insertResults = [];
  }

  call() {
    if (this.inputNodes.every(node => nodeIsNull(node))) {
      const outputSource = escapeString(getSource(this.outputNodes[0]));
      this.builderNode.addConvertPattern(`insert(${outputSource}, { at: "beginning" });`);
      return;
    }

    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];
    this.iterateNodes(firstOutputNode, firstInputNode);

    this.insertResults.forEach(result => {
      const pattern = `insert(${escapeString(result.newCode)}, { to: "${result.to}", at: "${result.at}" });`;
      this.builderNode.addConvertPattern(pattern);
    });

  }

  iterateNodes(outputNode: GenericNode | GenericNode[], inputNode: GenericNode | GenericNode[], key?: string) {
    if (Array.isArray(outputNode) && Array.isArray(inputNode)) {
      if (inputNode.length >= outputNode.length) {
        return;
      }
      const insertIndices = [];
      let inputIndex = 0;
      let outputIndex = 0;
      while (true) {
        if (nodesEqual(outputNode[outputIndex], inputNode[inputIndex])) {
          outputIndex++;
          inputIndex++;
          continue;
        }
        insertIndices.push({ outputIndex, inputIndex });
        outputIndex++;
        if (outputIndex >= outputNode.length) {
          break;
        }
      }
      if (insertIndices.length === outputNode.length - inputNode.length) {
        insertIndices.forEach(({ outputIndex, inputIndex }) => {
          const index = inputIndex === inputNode.length? -1 : inputIndex;
          // FIXME: I want to insert ' autoComplete="email"' but it inserts 'autoComplete="email"',
          // I should find a better way to insert the whitespace.
          const source = 'getFullText' in outputNode[outputIndex] ? outputNode[outputIndex]['getFullText']() : getSource(outputNode[outputIndex]);
          this.insertResults.push({
            to: key ? `${key}.${index}` : index.toString(),
            at: index === -1 ? "end" : "beginning",
            newCode: source,
          });
        });
      }
    }

    if (isNode(outputNode) && isNode(inputNode) && NodeQuery.getAdapter().getNodeType(outputNode) === NodeQuery.getAdapter().getNodeType(inputNode)) {
      getChildKeys(outputNode).forEach(childKey => {
        const newKey = key ? `${key}.${childKey}` : childKey;
        if (nodesEqual(outputNode[childKey], inputNode[childKey])) {
          return;
        }
        if (typeof inputNode[childKey] === "undefined" && typeof outputNode[childKey] !== "undefined") {
          this.insertResults.push({
            to: newKey,
            at: 'beginning',
            newCode: getSource(outputNode[childKey]),
          });
          return;
        }
        this.iterateNodes(outputNode[childKey], inputNode[childKey], newKey);
      });
    }
  }
}

export default InsertConverter;
