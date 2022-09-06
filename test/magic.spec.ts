import dedent from "dedent";
import Magic from "../lib/magic";
import { NqlOrRules } from "../lib/magic/types";

describe("Magic", () => {
  describe(".call", () => {
    it('gets a js snippet', () => {
      const extension = "js";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(extension, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
          replace("expression.expression", { with: "Array" });
        });
      `);
    });

    it('gets a ts snippet with rules', () => {
      const extension = "ts";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(extension, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
          replace("expression.expression", { with: "Array" });
        });
      `);
    });

    it('gets a ts snippet with nql', () => {
      const extension = "ts";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(extension, inputs, outputs, NqlOrRules.nql);
      expect(snippet).toEqual(dedent`
        findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.0=.Identifier][arguments.length=1]\`, () => {
          replace("expression.expression", { with: "Array" });
        });
      `);
    });

    it("gets ts type", () => {
      const extension = "ts";
      const inputs = [`const x: Array<string> = ['a', 'b'];`, `const y: Array<string> = ['c', 'd'];`];
      const outputs = [`const x: string[] = ['a', 'b'];`, `const y: string[] = ['c', 'd'];`];
      const snippet = Magic.call(extension, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "FirstStatement", declarationList: { nodeType: "VariableDeclarationList", declarations: { 0: { nodeType: "VariableDeclaration", name: { nodeType: "Identifier" }, initializer: { nodeType: "ArrayLiteralExpression", elements: { 0: { nodeType: "StringLiteral" }, 1: { nodeType: "StringLiteral" }, length: 2 } }, type: { nodeType: "TypeReference", typeName: "Array", typeArguments: { 0: { nodeType: "StringKeyword" }, length: 1 } } }, length: 1 } } }, () => {
          replace("declarationList.declarations.0.type", { with: "string[]" });
        });
      `);
    });
  });
});