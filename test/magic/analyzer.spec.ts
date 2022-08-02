import dedent from "dedent";
import Analyzer from "../../lib/magic/analyzer";

describe("Analyzer", () => {
  describe("#call", () => {
    it("gets pattern", () => {
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const analyzer = new Analyzer(inputs, outputs);
      const expected = dedent`
        withNode({ type: "ExpressionStatement", expression: { type: "CallExpression", expression: { type: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } } }, () => {
          replaceWith Array.{{expression.name}}({{arguments.0}});
        });
      `;
      expect(analyzer.call()).toEqual([expected]);
    });
  });
});