import debug from "debug";
import Analyzer from "./magic/analyzer";
import { NqlOrRules } from "./magic/types";
import Verifier from "./magic/verifier";

class Magic {
  static call(language: string, parser: string, inputs: string[], outputs: string[], nqlOrRules: NqlOrRules): string[] {
    const snippets = new Analyzer(language, parser, inputs, outputs, nqlOrRules).call()
    return snippets.filter(snippet => new Verifier(snippet, language, parser, inputs, outputs).call());
  }
}

export default Magic;
