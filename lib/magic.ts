import debug from "debug";
import Analyzer from "./magic/analyzer";
import { NqlOrRules } from "./magic/types";
import Verifier from "./magic/verifier";

class Magic {
  static call(language: string, inputs: string[], outputs: string[], nqlOrRules: NqlOrRules): string[] {
    const snippets = new Analyzer(language, inputs, outputs, nqlOrRules).call()
    snippets.forEach(snippet => debug("synvert-api:analyzer")(`snippet: ${snippet}`));
    return snippets.filter(snippet => new Verifier(snippet, language, inputs, outputs).call());
  }
}

export default Magic;
