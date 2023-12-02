import NodeQuery from "@xinminlabs/node-query";
import ConvertPattern from "./convert-pattern";
import FindPattern from "./find-pattern";
import { NqlOrRules } from "./types";
import { getFileExtension, parseCode } from "./utils";
import mock from "mock-fs";

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
      return new FindPattern(this.parser, inputNodes, outputNodes, this.nqlOrRules, (options) => {
        new ConvertPattern(options).call();
      }).call();
    } finally {
      mock.restore();
    }
  }
}

export default Analyzer;