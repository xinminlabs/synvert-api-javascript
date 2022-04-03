import { generateAst, parseSynvertSnippet } from '../lib/api';

describe("genereteAst", () => {
  it("gets node from source code", () => {
    const code = "class Synvert {}";
    const path = "lib/code.js";
    const node = generateAst(code, path)
    expect(node).not.toBeNull();
  });

  it("raises error if source code is invalid", () => {
    const code = "class Synvert }";
    const path = "lib/code.js";
    expect(() => { generateAst(code, path) }).toThrow(SyntaxError);
  });

  it("gets jsx node from source code", () => {
    const code = `
      class Test extends Component {
        render() {
          return <Button />
        }
      }
    `
    const path = "lib/code.jsx";
    const node = generateAst(code, path)
    expect(node).not.toBeNull();
  });
});

describe("parseSynvertSnippet", () => {
  const path = "lib/code.js";

  it("gets output from source code and snippet", () => {
    const code = "class Synvert {}";
    const snippet = `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("javascript", "use-strict", () => {
        withinFiles(Synvert.ALL_FILES, () => {
          unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
            prepend("'use strict'");
          });
        });
      });
    `;
    const output = parseSynvertSnippet(code, path, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 1", () => {
    const code = "class Synvert {}";
    const snippet = `
      new Synvert.Rewriter("javascript", "use-strict", () => {
        withinFiles(Synvert.ALL_FILES, () => {
          unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
            prepend("'use strict'");
          });
        });
      });
    `;
    const output = parseSynvertSnippet(code, path, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 2", () => {
    const code = "class Synvert {}";
    const snippet = `
      withinFiles(Synvert.ALL_FILES, () => {
        unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
          prepend("'use strict'");
        });
      });
    `;
    const output = parseSynvertSnippet(code, path, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 3", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ type: "ExpressionStatement", directive: "use strict" }, () => {
        prepend("'use strict'");
      });
    `;
    const output = parseSynvertSnippet(code, path, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("raises error if snippet is invalid", () => {
    const code = "class Synvert {}";
    const snippet = `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("javascript", "use-strict", () => {
    `;
    expect(() => { parseSynvertSnippet(code, path, snippet) }).toThrow(SyntaxError);
  });
});