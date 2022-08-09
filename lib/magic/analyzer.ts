import { SyntaxKind } from "typescript";
import ConvertPattern from "./convert-pattern";
import FindPattern from "./find-pattern";
import { parseCode } from "./utils";

class Analyzer {
  constructor(private inputs: string[], private outputs: string[]) {}

  call() {
    let inputNodes = this.inputs.map(input => parseCode(input));
    let outputNodes = this.outputs.map(output => parseCode(output));
    if (inputNodes.every(node => node.kind === SyntaxKind.ExpressionStatement)) {
      inputNodes = inputNodes.map(node => node["expression"]);
    }
    if (outputNodes.every(node => node.kind === SyntaxKind.ExpressionStatement)) {
      outputNodes = outputNodes.map(node => node["expression"]);
    }
    return new FindPattern(inputNodes, outputNodes, (options) => {
      new ConvertPattern(options).call();
    }).call();
  }
}

export default Analyzer;