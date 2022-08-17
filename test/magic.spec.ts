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
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } }, () => {
          replaceWith("Array.{{expression.name}}({{arguments.0}})");
        });
      `);
    });

    it('gets a ts snippet with rules', () => {
      const extension = "ts";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(extension, inputs, outputs, NqlOrRules.rules);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } }, () => {
          replaceWith("Array.{{expression.name}}({{arguments.0}})");
        });
      `);
    });

    it('gets a ts snippet with nql', () => {
      const extension = "ts";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(extension, inputs, outputs, NqlOrRules.nql);
      expect(snippet).toEqual(dedent`
        findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.length=1]\`, () => {
          replaceWith("Array.{{expression.name}}({{arguments.0}})");
        });
      `);
    });
  });
});