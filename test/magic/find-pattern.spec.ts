import dedent from "dedent";
import FindPattern from "../../lib/magic/find-pattern";
import { NqlOrRules } from "../../lib/magic/types";
import { parseJS } from "../test-helper";

describe("FindPattern", () => {
  describe("#call", () => {
    it("finds pattern", () => {
      const inputNodes = [parseJS("$.isArray(foo)")["expression"], parseJS("$.isArray(bar)")["expression"]];
      const outputNodes = [parseJS("Array.isArray(foo)")["expression"], parseJS("Array.isArray(bar)")["expression"]];
      const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.rules, () => {});
      const expected = dedent`
        withNode({ nodeType: "CallExpression", expression: { nodeType: "PropertyAccessExpression", expression: "$", name: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
        });
      `;
      expect(findPattern.call()).toEqual([expected]);
    });

    it("finds pattern with nql", () => {
      const inputNodes = [parseJS("$.isArray(foo)")["expression"], parseJS("$.isArray(bar)")["expression"]];
      const outputNodes = [parseJS("Array.isArray(foo)")["expression"], parseJS("Array.isArray(bar)")["expression"]];
      const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.nql, () => {});
      const expected = dedent`
        findNode(\`.CallExpression[expression=.PropertyAccessExpression[expression=$][name=isArray]][arguments.length=1][arguments.0=.Identifier]\`, () => {
        });
      `;
      expect(findPattern.call()).toEqual([expected]);
    });

    it("finds pattern if input is just a simple identifier", () => {
      const inputNodes = [parseJS("NaN")["expression"]];
      const outputNodes = [parseJS("Number.NaN")["expression"]];
      const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.rules, () => {});
      const expected = dedent`
        withNode({ nodeType: "Identifier", escapedText: "NaN" }, () => {
        });
      `;
      expect(findPattern.call()).toEqual([expected]);
    });

  });

  describe("#generatePatterns", () => {
    const findPattern = new FindPattern([], [], NqlOrRules.rules, () => {});

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
        arguments: {
          0: {
            nodeType: "Identifier",
          },
          length: 1,
        }
      });
    });

    it("gets pattern in array", () => {
      const nodes = [parseJS("const x: Array<string>"), parseJS("const y: Array<string>")];
      const patterns = findPattern['generatePatterns'](nodes);
      expect(patterns).toEqual({
        "nodeType": "FirstStatement",
        "declarationList": {
          "nodeType": "VariableDeclarationList",
          "declarations": {
            "length": 1,
            "0": {
              "initializer": undefined,
              "name": {
                "nodeType": "Identifier",
              },
              "nodeType": "VariableDeclaration",
              "type": {
                "nodeType": "TypeReference",
                "typeArguments": {
                  "0": {
                    "nodeType": "StringKeyword",
                  },
                  "length": 1,
                },
                "typeName": "Array",
              },
            },
          },
        },
      });
    });
  });

  describe("#valueInPattern", () => {
    const findPattern = new FindPattern([], [], NqlOrRules.rules, () => {});

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