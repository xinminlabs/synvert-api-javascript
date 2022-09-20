import { ConvertPatternOptions } from "./types";
import FindAndReplaceConverter from "./convert-pattern/find-and-replace-converter"
import FindAndReplaceWithConverter from "./convert-pattern/find-and-replace-with-converter"
import NoopConverter from "./convert-pattern/noop-converter";

export const PATTERNS = {
  noop: NoopConverter,
  findAndReplace: FindAndReplaceConverter,
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