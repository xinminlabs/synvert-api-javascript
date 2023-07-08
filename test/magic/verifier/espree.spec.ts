import dedent from "dedent";
import Verifier from "../../../lib/magic/verifier";

describe("Verifier", () => {
  describe("espree", () => {
    it("verifies the snippet", () => {
      const inputs = ["$.isArray(foo)", "$.isArray(bar)"];
      const outputs = ["Array.isArray(foo)", "Array.isArray(bar)"];
      const snippet = dedent`
        withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$", property: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
          replaceWith("Array.{{callee.property}}({{arguments.0}})");
        });
      `;
      const verifier = new Verifier(snippet, "javascript", "espree", inputs, outputs);
      expect(verifier.call()).toBeTruthy();
    });
  });
});