import dedent from 'dedent';
import { getTypescriptVersion, generateAst, parseSynvertSnippet, generateSnippets, parseNql, mutateCode, getAllSyntaxKind } from '../lib/api';
import { NqlOrRules } from '../lib/magic/types';

describe("getTypescriptVersion", () => {
  it("gets typescript version", () => {
    expect(getTypescriptVersion()).toEqual("4.9.3");
  });
});

describe("getAllSyntaxKind", () => {
  it("get all SyntaxKind", () => {
    expect(getAllSyntaxKind()).not.toBeNull();
  });
});

describe("genereteAst", () => {
  describe("typescript", () => {
    it("gets node from source code", () => {
      const code = "class Synvert {}";
      const node = generateAst("typescript", "typescript", code)
      expect(node).not.toBeNull();
    });

    it("raises error if source code is invalid", () => {
      const code = "class Synvert }";
      expect(() => { generateAst("typescript", "typescript", code) }).toThrow(new SyntaxError("'{' expected."));
    });

    it("gets jsx node from source code", () => {
      const code = `
        class Test extends Component {
          render() {
            return <Button />
          }
        }
      `
      const node = generateAst("typescript", "typescript", code)
      expect(node).not.toBeNull();
    });
  });

  describe("espree", () => {
    it("gets node", () => {
      const code = "class Synvert {}";
      const node = generateAst("javascript", "espree", code);
      expect(node).not.toBeNull();
    });
  });

  describe("gonzales-pe", () => {
    it("gets node", () => {
      const code = "a { color: read }";
      const node = generateAst("css", "gonzales-pe", code);
      expect(node).not.toBeNull();
    });
  });
});

describe("parseSynvertSnippet", () => {
  it("gets output from source code and snippet", () => {
    const code = "class Synvert {}";
    const snippet = `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("javascript", "use-strict", () => {
        configure({ parser: Synvert.Parser.TYPESCRIPT });
        withinFiles(Synvert.ALL_JS_FILES, () => {
          unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
            insert("'use strict'\\n", { at: "beginning" });
          });
        });
      });
    `;
    const output = parseSynvertSnippet("javascript", "typescript", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 1", () => {
    const code = "class Synvert {}";
    const snippet = `
      new Synvert.Rewriter("javascript", "use-strict", () => {
        configure({ parser: Synvert.Parser.TYPESCRIPT });
        withinFiles(Synvert.ALL_JS_FILES, () => {
          unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
            insert("'use strict'\\n", { at: "beginning" });
          });
        });
      });
    `;
    const output = parseSynvertSnippet("javascript", "typescript", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 2", () => {
    const code = "class Synvert {}";
    const snippet = `
      withinFiles(Synvert.ALL_JS_FILES, () => {
        unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
          insert("'use strict'\\n", { at: "beginning" });
        });
      });
    `;
    const output = parseSynvertSnippet("javascript", "typescript", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 3", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    const output = parseSynvertSnippet("javascript", "espree", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("raises error if source code is invalid", () => {
    const code = "class Synvert }";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    expect(() => { parseSynvertSnippet("javascript", "typescript", code, snippet) }).toThrow(new SyntaxError("'{' expected."));
  });

  it("raises error if snippet is invalid", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () =>
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    expect(() => { parseSynvertSnippet("javascript", "typescript", code, snippet) }).toThrow(new SyntaxError("')' expected."));
  });
});

describe("genereteSnippets", () => {
  it("gets snippet with rules", () => {
    const language = "typescript";
    const parser = "typescript";
    const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
    const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
    expect(generateSnippets(language, parser, inputs, outputs, NqlOrRules.rules)).toEqual([dedent`
      withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
        replace("expression.expression", { with: "Array" });
      });
    `, dedent`
      withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
        replaceWith("Array.{{expression.name}}({{arguments.0}})");
      });
    `]);
  });

  it("gets snippet with nql", () => {
    const language = "javascript";
    const parser = "espree";
    const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
    const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
    expect(generateSnippets(language, parser, inputs, outputs, NqlOrRules.nql)).toEqual([dedent`
      findNode(\`.CallExpression[callee=.MemberExpression[object=$][property=isArray]][arguments.length=1][arguments.0=.Identifier]\`, () => {
        replace("callee.object", { with: "Array" });
      });
    `, dedent`
      findNode(\`.CallExpression[callee=.MemberExpression[object=$][property=isArray]][arguments.length=1][arguments.0=.Identifier]\`, () => {
        replaceWith("Array.{{callee.property}}({{arguments.0}})");
      });
    `]);
  });
});

describe("parseNql", () => {
  it("gets typescript node from nql", () => {
    const nql = ".ClassDeclaration";
    const code = "class Synvert {}";
    const ranges = parseNql("typescript", "typescript", nql, code);
    expect(ranges).toEqual([
      { start: { line: 1, column: 1 }, end: { line: 1, column: 17 } },
    ]);
  });

  it("gets espree node from nql", () => {
    const nql = ".ClassDeclaration";
    const code = "class Synvert {}";
    const ranges = parseNql("javascript", "espree", nql, code);
    expect(ranges).toEqual([
      { start: { line: 1, column: 1 }, end: { line: 1, column: 17 } },
    ]);
  });
});

describe("mutateCode", () => {
  it("gets typescript new source code", () => {
    const nql = ".ClassDeclaration";
    const code = "class Synvert {}";
    const mutationCode = 'replace(node, "name", { with: "Foobar" })';
    const result = mutateCode("typescript", "typescript", nql, code, mutationCode);
    expect(result.newSource).toEqual("class Foobar {}");
  });

  it("gets espree new source code", () => {
    const nql = ".ClassDeclaration";
    const code = "class Synvert {}";
    const mutationCode = 'replace(node, "id", { with: "Foobar" })';
    const result = mutateCode("javascript", "espree", nql, code, mutationCode);
    expect(result.newSource).toEqual("class Foobar {}");
  });
});