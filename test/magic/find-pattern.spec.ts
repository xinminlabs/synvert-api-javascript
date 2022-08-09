import dedent from "dedent";
import FindPattern from "../../lib/magic/find-pattern";
import { parseJS } from "../test-helper";

describe("FindPattern", () => {
  describe("#call", () => {
    it("finds pattern", () => {
      const inputNodes = [parseJS("$.isArray(foo)")["expression"], parseJS("$.isArray(bar)")["expression"]];
      const outputNodes = [parseJS("Array.isArray(foo)")["expression"], parseJS("Array.isArray(bar)")["expression"]];
      const findPattern = new FindPattern(inputNodes, outputNodes, () => {});
      const expected = dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } }, () => {
        });
      `;
      expect(findPattern.call()).toEqual([expected]);
    });
  });

  describe("#generatePatterns", () => {
    const findPattern = new FindPattern([], [], () => {});

    it("gets pattern", () => {
      const nodes = [parseJS("$.isArray(foo)")["expression"], parseJS("$.isArray(bar)")["expression"]];
      const patterns = findPattern['generatePatterns'](nodes);
      expect(patterns).toEqual({
        nodeType: "CallExpression",
        expression: {
          expression: "$",
          name: "isArray",
          nodeType: "PropertyAccessExpression",
        },
        arguments: { length: 1 }
      });
    });
  });

  describe("#valueInPattern", () => {
    const findPattern = new FindPattern([], [], () => {});

    it("get value for node", () => {
      const node = parseJS("$.isArray(foo)")["expression"];
      const value = findPattern['valueInPattern'](node);
      expect(value).toEqual({
        nodeType: "CallExpression",
        expression: {
          expression: "$",
          name: "isArray",
          nodeType: "PropertyAccessExpression",
        },
        arguments: { '0': 'foo', length: 1 }
      });
    });
  });
});