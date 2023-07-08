import NodeQuery from "@xinminlabs/node-query";
import ConvertPattern from "./convert-pattern";
import FindPattern from "./find-pattern";
import { NqlOrRules } from "./types";
import { getFileExtension, parseCode } from "./utils";
import mock from "mock-fs";

const SKIP_NODE_TYPE = "expression";

class Analyzer {
  constructor(private language: string, private parser: string, private inputs: string[], private outputs: string[], private nqlOrRules: NqlOrRules) {}

  call() {
    const fileExtension = getFileExtension(this.language);
    const mockFiles = {};
    this.inputs.forEach((input, index) => mockFiles[`input${index}.${fileExtension}`] = input);
    this.outputs.forEach((output, index) => mockFiles[`output${index}.${fileExtension}`] = output);
    try {
      mock(mockFiles);
      let inputNodes = this.inputs.map((input, index) => parseCode(this.language, this.parser, `input${index}.${fileExtension}`, input));
      let outputNodes = this.outputs.map((output, index) => parseCode(this.language, this.parser, `output${index}.${fileExtension}`, output));
      if (inputNodes.every(node => node && NodeQuery.getAdapter().getNodeType(node) === "ExpressionStatement")) {
        inputNodes = inputNodes.map(node => node[SKIP_NODE_TYPE]);
      }
      if (outputNodes.every(node => node && NodeQuery.getAdapter().getNodeType(node) === "ExpressionStatement")) {
        outputNodes = outputNodes.map(node => node[SKIP_NODE_TYPE]);
      }
      return new FindPattern(inputNodes, outputNodes, this.nqlOrRules, (options) => {
        new ConvertPattern(options).call();
      }).call();
    } finally {
      mock.restore();
    }
  }
}

export default Analyzer;