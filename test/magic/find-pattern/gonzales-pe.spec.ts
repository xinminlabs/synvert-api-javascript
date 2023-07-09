import mock from "mock-fs";
import dedent from "dedent";
import gonzales from "@xinminlabs/gonzales-pe";
import FindPattern from "../../../lib/magic/find-pattern";
import { NqlOrRules } from "../../../lib/magic/types";
import { parseCss } from "../../test-helper";

describe("FindPattern", () => {
  describe("#call", () => {
    describe("gonzales-pe", () => {
      it("finds pattern", () => {
        const inputFile1 = "input1.css";
        const inputSource1 = "a { color: red }";
        const inputFile2 = "input2.css";
        const inputSource2 = "a { color: blue }";
        try {
          mock({ [inputFile1]: inputSource1, [inputFile2]: inputSource2 });
          const inputNodes = [
            parseCss(inputSource1, inputFile1)['content'][0] as gonzales.Node,
            parseCss(inputSource2, inputFile2)['content'][0] as gonzales.Node,
          ];
          const outputNodes = [];
          const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.rules, () => {});
          const expected = dedent`
            withNode({ nodeType: "ruleset", selector: { nodeType: "selector", typeSelector: { nodeType: "typeSelector", ident: { nodeType: "ident" } } }, space: { nodeType: "space" }, block: { nodeType: "block", space: { nodeType: "space" }, declaration: { nodeType: "declaration", property: { nodeType: "property", ident: { nodeType: "ident" } }, propertyDelimiter: { nodeType: "propertyDelimiter" }, space: { nodeType: "space" }, value: { nodeType: "value", ident: { nodeType: "ident" } } } } }, () => {
            });
          `;
          expect(findPattern.call()).toEqual([expected]);
        } finally {
          mock.restore();
        }
      });

      it("finds pattern with nql", () => {
        const inputFile1 = "input1.css";
        const inputSource1 = "a { color: red }";
        const inputFile2 = "input2.css";
        const inputSource2 = "a { color: blue }";
        try {
          mock({ [inputFile1]: inputSource1, [inputFile2]: inputSource2 });
          const inputNodes = [
            parseCss(inputSource1, inputFile1)['content'][0] as gonzales.Node,
            parseCss(inputSource2, inputFile2)['content'][0] as gonzales.Node,
          ];
          const outputNodes = [];
          const findPattern = new FindPattern(inputNodes, outputNodes, NqlOrRules.nql, () => {});
          const expected = dedent`
            findNode(\`.ruleset[selector=.selector[typeSelector=.typeSelector[ident=.ident]]][space=.space][block=.block[space=.space][declaration=.declaration[property=.property[ident=.ident]][propertyDelimiter=.propertyDelimiter][space=.space][value=.value[ident=.ident]]]]\`, () => {
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