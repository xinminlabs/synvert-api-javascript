import dedent from "dedent";
import Verifier from "../../../lib/magic/verifier";

describe("Verifier", () => {
  describe("typescript", () => {
    it("verifies the snippet", () => {
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } }, () => {
          replaceWith("Array.{{expression.name}}({{arguments.0}})");
        });
      `;
      const verifier = new Verifier(snippet, "typescript", "typescript", inputs, outputs);
      expect(verifier.call()).toBeTruthy();
    });

    it("returns true if outputs is empty", () => {
      const verifier = new Verifier("", "typescript", "typescript", [], []);
      expect(verifier.call()).toBeTruthy();
    });
  });
});