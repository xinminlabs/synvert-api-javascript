import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import FindAndReplaceConverter from "../../../../lib/magic/convert-pattern/find-and-replace-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("FindAndReplaceConverter", () => {
  describe("#call", () => {
    describe("espree", () => {
      it("generates replace snippet", () => {
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
          const outputNodes = [
            parseJsByEspree(outputSource1, outputFile1)["body"][0]["expression"],
            parseJsByEspree(outputSource2, outputFile2)["body"][0]["expression"],
          ];
          const builderNode = new BuilderNode();
          const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`replace("callee.object", { with: "Array" });`);
        } finally {
          mock.restore();
        }
      });

      it("generates replace snippet 2", () => {
        const inputFile1 = "input1.jsx";
        const inputSource1 = `<div className="container-fluid">foo</div>`;
        const inputFile2 = "input2.jsx";
        const inputSource2 = `<div className="container-fluid">bar</div>`;
        const outputFile1 = "output1.jsx";
        const outputSource1 = `<Container fluid>foo</Container>`;
        const outputFile2 = "output2.jsx";
        const outputSource2 = `<Container fluid>bar</Container>`;
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
          const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(2);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`replace("closingElement", { with: "</Container>" });`);
          expect(builderNode["children"][1].generateSnippet()).toEqual(`replace("openingElement", { with: "<Container fluid>" });`);
        } finally {
          mock.restore();
        }
      });

      it("generates replace snippet 4", () => {
        const inputFile1 = "input1.js";
        const inputSource1 = `foo.substr(start, length);`;
        const inputFile2 = "input2.js";
        const inputSource2 = `bar.substr(end, size);`;
        const outputFile1 = "output1.js";
        const outputSource1 = `foo.slice(start, start + length);`;
        const outputFile2 = "output2.js";
        const outputSource2 = `bar.slice(end, end + size)`;
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
          const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
          converter.call();
          expect(builderNode["children"].length).toEqual(2);
          expect(builderNode["children"][1].generateSnippet()).toEqual(`replace("callee.property", { with: "slice" });`);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`replace("arguments.1", { with: "{{arguments.0}} + {{arguments.1}}" });`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});