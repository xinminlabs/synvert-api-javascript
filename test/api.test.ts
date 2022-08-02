import { generateAst, parseSynvertSnippet } from '../lib/api';

describe("genereteAst", () => {
  it("gets node from source code", () => {
    const code = "class Synvert {}";
    const node = generateAst(code)
    expect(node).not.toBeNull();
  });

  it("raises error if source code is invalid", () => {
    const code = "class Synvert }";
    expect(() => { generateAst(code) }).toThrow(SyntaxError);
  });

  it("gets jsx node from source code", () => {
    const code = `
      class Test extends Component {
        render() {
          return <Button />
        }
      }
    `
    const node = generateAst(code)
    expect(node).not.toBeNull();
  });
});

describe("parseSynvertSnippet", () => {
  it("gets output from source code and snippet", () => {
    const code = "class Synvert {}";
    const snippet = `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("javascript", "use-strict", () => {
        withinFiles(Synvert.ALL_JS_FILES, () => {
          unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
            insert("'use strict'\\n", { at: "beginning" });
          });
        });
      });
    `;
    const output = parseSynvertSnippet(code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 1", () => {
    const code = "class Synvert {}";
    const snippet = `
      new Synvert.Rewriter("javascript", "use-strict", () => {
        withinFiles(Synvert.ALL_JS_FILES, () => {
          unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
            insert("'use strict'\\n", { at: "beginning" });
          });
        });
      });
    `;
    const output = parseSynvertSnippet(code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 2", () => {
    const code = "class Synvert {}";
    const snippet = `
      withinFiles(Synvert.ALL_JS_FILES, () => {
        unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
          insert("'use strict'\\n", { at: "beginning" });
        });
      });
    `;
    const output = parseSynvertSnippet(code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 3", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    const output = parseSynvertSnippet(code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("raises error if snippet is invalid", () => {
    const code = "class Synvert {}";
    const snippet = `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("javascript", "use-strict", () => {
    `;
    expect(() => { parseSynvertSnippet(code, snippet) }).toThrow(SyntaxError);
  });
});