import { SyntaxKind } from "typescript";
import ConvertPattern from "./convert-pattern";
import FindPattern from "./find-pattern";
import { NqlOrRules } from "./types";
import { parseCode } from "./utils";

const SKIP_NODE_TYPE = "expression";

class Analyzer {
  constructor(private language, private inputs: string[], private outputs: string[], private nqlOrRules: NqlOrRules) {}

  call() {
    let inputNodes = this.inputs.map(input => parseCode(this.language, input));
    let outputNodes = this.outputs.map(output => parseCode(this.language, output));
    if (inputNodes.every(node => node && node.kind === SyntaxKind.ExpressionStatement)) {
      inputNodes = inputNodes.map(node => node[SKIP_NODE_TYPE]);
    }
    if (outputNodes.every(node => node && node.kind === SyntaxKind.ExpressionStatement)) {
      outputNodes = outputNodes.map(node => node[SKIP_NODE_TYPE]);
    }
    return new FindPattern(inputNodes, outputNodes, this.nqlOrRules, (options) => {
      new ConvertPattern(options).call();
    }).call();
  }
}

export default Analyzer;