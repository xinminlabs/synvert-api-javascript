import dedent from 'dedent';
import { getTypescriptVersion, generateAst, parseSynvertSnippet, generateSnippet, parseNql, mutateCode, getAllSyntaxKind } from '../lib/api';
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
  it("gets node from source code", () => {
    const code = "class Synvert {}";
    const node = generateAst("typescript", code)
    expect(node).not.toBeNull();
  });

  it("raises error if source code is invalid", () => {
    const code = "class Synvert }";
    expect(() => { generateAst("typescript", code) }).toThrow(new SyntaxError("'{' expected."));
  });

  it("gets jsx node from source code", () => {
    const code = `
      class Test extends Component {
        render() {
          return <Button />
        }
      }
    `
    const node = generateAst("typescript", code)
    expect(node).not.toBeNull();
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
    const output = parseSynvertSnippet("javascript", code, snippet);
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
    const output = parseSynvertSnippet("javascript", code, snippet);
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
    const output = parseSynvertSnippet("javascript", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 3", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    const output = parseSynvertSnippet("javascript", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("raises error if source code is invalid", () => {
    const code = "class Synvert }";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    expect(() => { parseSynvertSnippet("javascript", code, snippet) }).toThrow(new SyntaxError("'{' expected."));
  });

  it("raises error if snippet is invalid", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () =>
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    expect(() => { parseSynvertSnippet("javascript", code, snippet) }).toThrow(new SyntaxError("')' expected."));
  });
});

describe("genereteSnippet", () => {
  it("gets snippet with rules", () => {
    const language = "typescript";
    const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
    const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
    expect(generateSnippet(language, inputs, outputs, NqlOrRules.rules)).toEqual(dedent`
      withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
        replace("expression.expression", { with: "Array" });
      });
    `);
  });

  it("gets snippet with nql", () => {
    const language = "typescript";
    const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
    const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
    expect(generateSnippet(language, inputs, outputs, NqlOrRules.nql)).toEqual(dedent`
      findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.0=.Identifier][arguments.length=1]\`, () => {
        replace("expression.expression", { with: "Array" });
      });
    `);
  });
});

describe("parseNql", () => {
  it("gets node from nql", () => {
    const nql = ".ClassDeclaration";
    const code = "class Synvert {}";
    const ranges = parseNql("ts", nql, code);
    expect(ranges).toEqual([
      { start: { line: 1, column: 1 }, end: { line: 1, column: 17 } },
    ]);
  });
});

describe("mutateCode", () => {
  it("gets new source code", () => {
    const nql = ".ClassDeclaration";
    const code = "class Synvert {}";
    const mutationCode = 'replace(node, "name", { with: "Foobar" })';
    const result = mutateCode("ts", nql, code, mutationCode);
    expect(result.newSource).toEqual("class Foobar {}");
  });
});