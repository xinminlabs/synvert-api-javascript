import mock from "mock-fs";
import dedent from "dedent";
import FindPattern from "../../../lib/magic/find-pattern";
import { NqlOrRules } from "../../../lib/magic/types";
import { parseJsByEspree } from "../../test-helper";

describe("FindPattern", () => {
  describe("#call", () => {
    describe("espree", () => {
      it("finds pattern", () => {
        const inputFile1 = "input1.js";
        const inputSource1 = "$.isArray(foo)";
        const inputFile2 = "input2.js";
        const inputSource2 = "$.isArray(bar)";
        const outputFile1 = "output1.js";
        const outputSource1 = "Array.isArray(foo)";
        const outputFile2 = "output2.js";
        const outputSource2 = "Array.isArray(bar)";
        try {
          mock({ [inputFile1]: inputSource1, [inputFile2]: inputSource2, [outputFile1]: outputSource1, [outputFile2]: outputSource2 });
          const inputNodes = [
            parseJsByEspree(inputSource1, inputFile1)["body"][0]["expression"],
            parseJsByEspree(inputSource2, inputFile2)["body"][0]["expression"],
          ];
          const outputNodes = [];
          const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.rules, () => {});
          const expected = dedent`
            withNode({ nodeType: "CallExpression", callee: { nodeType: "MemberExpression", object: "$", property: "isArray" }, arguments: { 0: { nodeType: "Identifier" }, length: 1 } }, () => {
            });
          `;
          expect(findPattern.call()).toEqual([expected]);
        } finally {
          mock.restore();
        }
      });

      it("finds pattern with nql", () => {
        const inputFile1 = "input1.js";
        const inputSource1 = "$.isArray(foo)";
        const inputFile2 = "input2.js";
        const inputSource2 = "$.isArray(bar)";
        try {
          mock({ [inputFile1]: inputSource1, [inputFile2]: inputSource2 });
          const inputNodes = [
            parseJsByEspree(inputSource1, inputFile1)["body"][0]["expression"],
            parseJsByEspree(inputSource2, inputFile2)["body"][0]["expression"],
          ];
          const outputNodes = [];
          const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.nql, () => {});
          const expected = dedent`
            findNode(\`.CallExpression[callee=.MemberExpression[object=$][property=isArray]][arguments.length=1][arguments.0=.Identifier]\`, () => {
            });
          `;
          expect(findPattern.call()).toEqual([expected]);
        } finally {
          mock.restore();
        }
      });

      it("finds pattern if input is just a simple identifier", () => {
        const inputFile = "input.js";
        const inputSource = "NaN";
        try {
          mock({ [inputFile]: inputSource });
          const inputNodes = [
            parseJsByEspree(inputSource, inputFile)["body"][0]["expression"],
          ];
          const outputNodes = [];
          const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.rules, () => {});
          const expected = dedent`
            withNode({ nodeType: "Identifier", escapedText: "NaN" }, () => {
            });
          `;
          expect(findPattern.call()).toEqual([expected]);
        } finally {
          mock.restore();
        }
      });
    });
  });
});