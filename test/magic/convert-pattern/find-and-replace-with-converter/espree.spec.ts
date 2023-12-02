import { Node } from "acorn";
import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndReplaceWithConverter from "../../../../lib/magic/convert-pattern/find-and-replace-with-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("FindAndReplaceWithConverter", () => {
  describe("espree", () => {
    const parser = "espree";

    describe("#call", () => {
      it("generates replaceWith snippet", () => {
        const inputFile1 = "input1.js";
        const inputSource1 = "$.isArray(foo)";
        const inputFile2 = "input2.js";
        const inputSource2 = "$.isArray(bar)";
        const outputFile1 = "output1.js";
        const outputSource1 = "jQuery.isArray(foo)";
        const outputFile2 = "output2.js";
        const outputSource2 = "jQuery.isArray(bar)";
        try {
          mock({ [inputFile1]: inputSource1, [inputFile2]: inputSource2, [outputFile1]: outputSource1, [outputFile2]: outputSource2 });
          const inputNodes = [
            parseJsByEspree(inputSource1, inputFile1)["body"][0]["expression"],
            parseJsByEspree(inputSource2, inputFile2)["body"][0]["expression"],
          ];
          const outputNodes = [
            parseJsByEspree(outputSource1, outputFile1)["body"][0]["expression"],
            parseJsByEspree(outputSource2, outputFile2)["body"][0]["expression"],
          ];
          const builderNode = new BuilderNode();
          const converter = new FindAndReplaceWithConverter<Node>(parser, inputNodes, outputNodes, builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`replaceWith("jQuery.{{callee.property}}({{arguments.0}})");`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});