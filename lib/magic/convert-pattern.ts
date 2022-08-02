import { ConvertPatternOptions } from "./types";
import FindAndReplaceConverter from "./convert-pattern/find-and-replace-converter"

const PATTERNS = {
  findAndReplace: FindAndReplaceConverter,
}

class ConvertPattern {
  constructor(private options: ConvertPatternOptions) {}

  call() {
    const { inputNodes, outputNodes, builderNode, converterType } = this.options;
    new PATTERNS[converterType](inputNodes, outputNodes, builderNode).call();
  }
}

export default ConvertPattern;