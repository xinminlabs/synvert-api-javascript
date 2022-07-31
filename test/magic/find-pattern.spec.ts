import FindPattern from "../../lib/magic/find-pattern";
import { parseJS } from "../test-helper";

describe("FindPattern", () => {
  describe("#call", () => {
    it("finds pattern", () => {
      const inputNodes = [parseJS("$.isArray(foo)"), parseJS("$.isArray(bar)")];
      const outputNodes = [parseJS("Array.isArray(foo)"), parseJS("Array.isArray(bar)")];
      const findPattern = new FindPattern(inputNodes, outputNodes);
      const expected = `withNode({ type: "ExpressionStatement", expression: { type: "CallExpression", expression: { type: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { length: 1 } } }, () => {\n});`;
      expect(findPattern.call()).toEqual([expected]);
    });
  });

  describe("#generatePatterns", () => {
    const findPattern = new FindPattern([], []);

    it("gets pattern", () => {
      const nodes = [parseJS("$.isArray(foo)"), parseJS("$.isArray(bar)")];
      const patterns = findPattern['generatePatterns'](nodes);
      expect(patterns).toEqual({
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          expression: {
            expression: "$",
            name: "isArray",
            type: "PropertyAccessExpression",
          },
          arguments: { length: 1 }
        }
      });
    });
  });

  describe("#valueInPattern", () => {
    const findPattern = new FindPattern([], []);

    it("get value for node", () => {
      const node = parseJS("$.isArray(foo)");
      const value = findPattern['valueInPattern'](node);
      expect(value).toEqual({
        type: "ExpressionStatement",
        expression: {
          type: "CallExpression",
          expression: {
            expression: "$",
            name: "isArray",
            type: "PropertyAccessExpression",
          },
          arguments: { '0': 'foo', length: 1 }
        }
      });
    });
  });
});