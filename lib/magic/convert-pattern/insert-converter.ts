import { Node } from "typescript";
import BaseConverter from "./base-converter";
import { BuilderNode } from "../builder";
import { escapeString, getChildKeys, getNodeType, isNode, nodesEqual } from "../utils";

type InsertResult = {
  to: string,
  at: string,
  newCode: string
}

class InsertConverter extends BaseConverter {
  private insertResults: InsertResult[];

  constructor(protected inputNodes: Node[], protected outputNodes: Node[], protected builderNode: BuilderNode) {
    super(inputNodes, outputNodes, builderNode);
    this.insertResults = [];
  }

  call() {
    if (this.inputNodes.every(node => typeof node === "undefined")) {
      const outputSource = escapeString(this.outputNodes[0].getFullText());
      this.builderNode.addConvertPattern(`insert(${outputSource}, { at: "beginning" });`);
      return
    }

    const firstInputNode = this.inputNodes[0];
    const firstOutputNode = this.outputNodes[0];
    this.iterateNodes(firstOutputNode, firstInputNode);

    this.insertResults.forEach(result => {
      const pattern = `insert(${escapeString(result.newCode)}, { to: "${result.to}", at: "${result.at}" });`;
      this.builderNode.addConvertPattern(pattern);
    });

  }

  iterateNodes(outputNode: Node | Node[], inputNode: Node | Node[], key?: string) {
    if (Array.isArray(outputNode) && Array.isArray(inputNode)) {
      if (inputNode.length >= outputNode.length) {
        return;
      }
      const insertIndices = [];
      for (let inputIndex = 0, outputIndex = 0; inputIndex < inputNode.length || outputIndex < outputNode.length;) {
        if (nodesEqual(outputNode[outputIndex], inputNode[inputIndex])) {
          outputIndex++;
          inputIndex++;
          continue;
        }
        insertIndices.push({ outputIndex, inputIndex });
        outputIndex++;
      }
      if (insertIndices.length === outputNode.length - inputNode.length) {
        insertIndices.forEach(({ outputIndex, inputIndex }) => {
          const index = inputIndex === inputNode.length? -1 : inputIndex;
          this.insertResults.push({
            to: key ? `${key}.${index}` : index.toString(),
            at: index === -1 ? "end" : "beginning",
            newCode: outputNode[outputIndex].getFullText(),
          });
        });
      }
    }

    if (isNode(outputNode) && isNode(inputNode) && getNodeType(outputNode) === getNodeType(inputNode)) {
      getChildKeys(getNodeType(outputNode)).forEach(childKey => {
        const newKey = key ? `${key}.${childKey}` : childKey;
        if (nodesEqual(outputNode[childKey], inputNode[childKey])) {
          return;
        }
        if (typeof inputNode[childKey] === "undefined" && typeof outputNode[childKey] !== "undefined") {
          this.insertResults.push({
            to: newKey,
            at: 'beginning',
            newCode: outputNode[childKey].getFullText(),
          });
          return;
        }
        this.iterateNodes(outputNode[childKey], inputNode[childKey], newKey);
      });
    }
  }
}

export default InsertConverter;
