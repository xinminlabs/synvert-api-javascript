import dedent from "dedent";
import Magic from "../lib/magic";

describe("Magic", () => {
  describe(".call", () => {
    it('gets a snippet', () => {
      const extension = "ts";
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = Magic.call(extension, inputs, outputs);
      expect(snippet).toEqual(dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } }, () => {
          replaceWith("Array.{{expression.name}}({{arguments.0}})");
        });
      `);
    });
  });
});