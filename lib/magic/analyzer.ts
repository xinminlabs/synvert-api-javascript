import { SyntaxKind } from "typescript";
import ConvertPattern from "./convert-pattern";
import FindPattern from "./find-pattern";
import { parseCode } from "./utils";

const SKIP_NODE_TYPE = "expression";

class Analyzer {
  constructor(private extension, private inputs: string[], private outputs: string[]) {}

  call() {
    let inputNodes = this.inputs.map(input => parseCode(this.extension, input));
    let outputNodes = this.outputs.map(output => parseCode(this.extension, output));
    if (inputNodes.every(node => node.kind === SyntaxKind.ExpressionStatement)) {
      inputNodes = inputNodes.map(node => node[SKIP_NODE_TYPE]);
    }
    if (outputNodes.every(node => node.kind === SyntaxKind.ExpressionStatement)) {
      outputNodes = outputNodes.map(node => node[SKIP_NODE_TYPE]);
    }
    return new FindPattern(inputNodes, outputNodes, (options) => {
      new ConvertPattern(options).call();
    }).call();
  }
}

export default Analyzer;