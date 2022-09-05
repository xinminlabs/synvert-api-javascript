import { ConvertPatternOptions } from "./types";
import FindAndReplaceWithConverter from "./convert-pattern/find-and-replace-with-converter"

const PATTERNS = {
  findAndReplaceWith: FindAndReplaceWithConverter,
}

class ConvertPattern {
  constructor(private options: ConvertPatternOptions) {}

  call() {
    const { inputNodes, outputNodes, builderNode, converterType } = this.options;
    new PATTERNS[converterType](inputNodes, outputNodes, builderNode).call();
  }
}

export default ConvertPattern;