import ConvertPattern from "./convert-pattern";
import FindPattern from "./find-pattern";
import { parseCode } from "./utils";

class Analyzer {
  constructor(private inputs: string[], private outputs: string[]) {}

  call() {
    const inputNodes = this.inputs.map(input => parseCode(input));
    const outputNodes = this.outputs.map(output => parseCode(output));
    return new FindPattern(inputNodes, outputNodes, (options) => {
      new ConvertPattern(options).call();
    }).call();
  }
}

export default Analyzer;