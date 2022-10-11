import dedent from 'dedent';
import { generateAst, parseSynvertSnippet, generateSnippet, parseNql, mutateCode } from '../lib/api';
import { NqlOrRules } from '../lib/magic/types';

describe("genereteAst", () => {
  it("gets node from source code", () => {
    const code = "class Synvert {}";
    const node = generateAst("ts", code)
    expect(node).not.toBeNull();
  });

  it("raises error if source code is invalid", () => {
    const code = "class Synvert }";
    expect(() => { generateAst("ts", code) }).toThrow(SyntaxError);
  });

  it("gets jsx node from source code", () => {
    const code = `
      class Test extends Component {
        render() {
          return <Button />
        }
      }
    `
    const node = generateAst("tsx", code)
    expect(node).not.toBeNull();
  });
});

describe("parseSynvertSnippet", () => {
  it("gets output from source code and snippet", () => {
    const code = "class Synvert {}";
    const snippet = `
      const Synvert = require("synvert-core");
      new Synvert.Rewriter("javascript", "use-strict", () => {
        configure({ parser: 'typescript' });
        withinFiles(Synvert.ALL_JS_FILES, () => {
          unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
            insert("'use strict'\\n", { at: "beginning" });
          });
        });
      });
    `;
    const output = parseSynvertSnippet("js", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 1", () => {
    const code = "class Synvert {}";
    const snippet = `
      new Synvert.Rewriter("javascript", "use-strict", () => {
        configure({ parser: 'typescript' });
        withinFiles(Synvert.ALL_JS_FILES, () => {
          unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
            insert("'use strict'\\n", { at: "beginning" });
          });
        });
      });
    `;
    const output = parseSynvertSnippet("js", code, snippet);
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
    const output = parseSynvertSnippet("js", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });

  it("gets output from source code and snippet when snippet is short 3", () => {
    const code = "class Synvert {}";
    const snippet = `
      unlessExistNode({ nodeType: "ExpressionStatement", directive: "use strict" }, () => {
        insert("'use strict'\\n", { at: "beginning" });
      });
    `;
    const output = parseSynvertSnippet("js", code, snippet);
    expect(output).toEqual("'use strict'\nclass Synvert {}");
  });
});

describe("genereteSnippet", () => {
  it("gets snippet with rules", () => {
    const extension = "ts";
    const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
    const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
    expect(generateSnippet(extension, inputs, outputs, NqlOrRules.rules)).toEqual(dedent`
      withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
        replace("expression.expression", { with: "Array" });
      });
    `);
  });

  it("gets snippet with nql", () => {
    const extension = "ts";
    const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
    const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
    expect(generateSnippet(extension, inputs, outputs, NqlOrRules.nql)).toEqual(dedent`
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
    const ranges = parseNql(nql, code);
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
    const result = mutateCode(nql, code, mutationCode);
    expect(result.newSource).toEqual("class Foobar {}");
  });
});