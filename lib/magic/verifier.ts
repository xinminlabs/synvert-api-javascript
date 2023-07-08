import debug from "debug";
import fs from "fs";
import mock from "mock-fs";
import { Rewriter, rewriteSnippetToSyncVersion } from 'synvert-core';
import { getFileName } from "./utils";

const rstrip = (str: string) => str.replace(/\s+$/gm, '');

class Verifier {
  constructor(private snippet: string, private language: string, private parser: string, private inputs: string[], private outputs: string[]) { }

  call(): boolean {
    if (this.outputs.length === 0) {
      return true;
    }

    try {
      return this.inputs.every((input, index) => {
        const fileName = getFileName(this.language);
        const snippet = `
          new Synvert.Rewriter("group", "name", () => {
            configure({ parser: Synvert.Parser.${this.parser.toUpperCase().replace("-", "_")} });
            withinFile("${fileName}", () => {
              ${this.snippet}
            });
          });
        `;
        const rewriter = eval(rewriteSnippetToSyncVersion(snippet));
        mock({ [fileName]: input });
        rewriter.processSync();
        const actualOutput = fs.readFileSync(fileName, "utf-8");
        const expectedOutput = this.outputs[index];
        debug("synvert-api:verifier")(`snippet: ${snippet}`);
        debug("synvert-api:verifier")(`actualOutput: ${actualOutput}`);
        debug("synvert-api:verifier")(`expectedOutput: ${expectedOutput}`);
        return rstrip(actualOutput) === rstrip(expectedOutput);
      });
    } finally {
      Rewriter.rewriters = {};
      mock.restore();
    }
  }
}

export default Verifier;