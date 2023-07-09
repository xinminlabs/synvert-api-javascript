import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndReplaceWithConverter from "../../../../lib/magic/convert-pattern/find-and-replace-with-converter";
import { parseCss } from "../../../test-helper";

describe("FindAndReplaceWithConverter", () => {
  describe("#call", () => {
    describe("gonzales-pe", () => {
      it("generates replaceWith snippet", () => {
        const inputFile = "input1.css";
        const inputSource = "a { color: red }";
        const outputFile = "output1.css";
        const outputSource = "a { color: blue }";
        try {
          mock({ [inputFile]: inputSource, [outputFile]: outputSource });
          const inputNodes = [parseCss(inputSource, inputFile)];
          const outputNodes = [parseCss(outputSource, outputFile)];
          const builderNode = new BuilderNode();
          const converter = new FindAndReplaceWithConverter(inputNodes, outputNodes, builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`replaceWith("a { color: blue }");`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});