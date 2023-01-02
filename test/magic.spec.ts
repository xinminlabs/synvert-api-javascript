import dedent from "dedent";
import Magic from "../lib/magic";
import { NqlOrRules } from "../lib/magic/types";

describe("Magic", () => {
  describe(".call", () => {
    it('gets a js snippet', () => {
      const language = "javascript";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
          replace("expression.expression", { with: "Array" });
        });
      `);
    });

    it('gets a ts snippet with rules', () => {
      const language = "typescript";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
          replace("expression.expression", { with: "Array" });
        });
      `);
    });

    it('gets a ts snippet with nql', () => {
      const language = "typescript";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.nql);
      expect(snippet).toEqual(dedent`
        findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.0=.Identifier][arguments.length=1]\`, () => {
          replace("expression.expression", { with: "Array" });
        });
      `);
    });

    it("gets ts type", () => {
      const language = "typescript";
      const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
      const outputs = [`const x: string[] = ['a', 'b'];`, `const y: string[] = ['c', 'd'];`];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
          replace("declarationList.declarations.0.type", { with: "{{declarationList.declarations.0.type.typeArguments.0}}[]" });
        });
      `);
    });

    it("gets a noop", () => {
      const language = "typescript";
      const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
      const snippet = Magic.call(language, inputs, [], NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
          noop();
        });
      `);
    });

    it("gets a remove", () => {
      const language = "typescript";
      const inputs = [`console.log("hello world")`];
      const outputs = [""];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "console", name: "log" }, arguments: { 0: { nodeType: "StringLiteral", text: "hello world" }, length: 1 } }, () => {
          remove();
        });
      `);
    });

    it("gets an insert", () => {
      const language = "typescript";
      const inputs = [""];
      const outputs = ["console.log('hello world')"];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(`insert("console.log('hello world')", { at: "beginning" });`);
    });

    it('gets a snippet with empty string', () => {
      const language = "typescript";
      const inputs = ["string.split('')", "str.split('')"];
      const outputs = ["[...string]", "[...str]"];
      const snippet = Magic.call(language, inputs, outputs, NqlOrRules.nql);
      expect(snippet).toEqual(dedent`
        findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=.Identifier][name=split]][arguments.0=.StringLiteral[text=""]][arguments.length=1]\`, () => {
          replaceWith("[...{{expression.expression}}]");
        });
      `);
    });
  });
});