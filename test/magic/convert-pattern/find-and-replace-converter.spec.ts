import { BuilderNode } from "../../../lib/magic/builder";
import FindAndReplaceConverter from "../../../lib/magic/convert-pattern/find-and-replace-converter";
import { parseJS, parseJSX, parseTS } from "../../test-helper";

describe("FindAndReplaceConverter", () => {
  const converter = new FindAndReplaceConverter([], [], new BuilderNode());

  describe("#generateReplacePatterns", () => {
    it("generates patterns", () => {
      converter["addReplaceResult"]("arguments", '("foo", "bar")');
      converter["addReplaceResult"]("arguments.0", '"foo"');
      converter["addReplaceResult"]("arguments.1", '"bar"');
      converter["addReplaceResult"]("expression.expression", "$");
      converter["addReplaceResult"]("expression.name", "isArray");
      const patterns = converter["generateReplacePatterns"]();
      expect(patterns).toEqual([
        `replace("arguments", { with: "(\"foo\", \"bar\")" });`,
        `replace("expression.expression", { with: "$" });`,
        `replace("expression.name", { with: "isArray" });`,
      ]);
    });
  });

  describe("#replaceNode", () => {
    it("is all children replaced", () => {
      const inputNode = parseJS("$.array(foo)")["expression"]
      const outputNode = parseJS("Array.isArray(bar)")["expression"]
      const allChildrenReplaced = converter["replaceNode"](inputNode, outputNode)
      expect(allChildrenReplaced).toBeTruthy();
    });

    it("is all children replaced for array", () => {
      const inputNode = parseJS("$.array(foo, bar)")["expression"]["arguments"]
      const outputNode = parseJS("Array.isArray(bar, foo)")["expression"]["arguments"]
      const allChildrenReplaced = converter["replaceNode"](inputNode, outputNode)
      expect(allChildrenReplaced).toBeTruthy();
    });

    it("is not all children replaced", () => {
      const inputNode = parseJS("$.isArray(foo)")["expression"]
      const outputNode = parseJS("Array.isArray(bar)")["expression"]
      const allChildrenReplaced = converter["replaceNode"](inputNode, outputNode)
      expect(allChildrenReplaced).toBeFalsy();
    });

    it("is not all children replaced for array", () => {
      const inputNode = parseJS("$.isArray(foo, foo)")["expression"]["arguments"]
      const outputNode = parseJS("Array.isArray(foo, bar)")["expression"]["arguments"]
      const allChildrenReplaced = converter["replaceNode"](inputNode, outputNode)
      expect(allChildrenReplaced).toBeFalsy();
    });
  });

  describe("#call", () => {
    it("generates replace snippet", () => {
      const inputNodes = [parseJS(`$.isArray(foo)`)["expression"], parseJS(`$.isArray(bar)`)["expression"]];
      const outputNodes = [parseJS(`Array.isArray(foo)`)["expression"], parseJS(`Array.isArray(bar)`)["expression"]];
      const builderNode = new BuilderNode();
      const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`replace("expression.expression", { with: "Array" });`);
    });

    it("generates replace snippet 2", () => {
      const inputNodes = [parseJSX(`<div className="container-fluid">foo</div>`)["expression"], parseJSX(`<div className="container-fluid">bar</div>`)["expression"]];
      const outputNodes = [parseJSX(`<Container fluid>foo</Container>`)["expression"], parseJSX(`<Container fluid>bar</Container>`)["expression"]];
      const builderNode = new BuilderNode();
      const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(2);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`replace("closingElement", { with: "</Container>" });`);
      expect(builderNode["children"][1].generateSnippet()).toEqual(`replace("openingElement", { with: "<Container fluid>" });`);
    });

    it("generates replace snippet 3", () => {
      const inputNodes = [parseTS(`const x: Array<string> = ['a', 'b']`), parseTS(`const y: Array<string> = ['c', 'd']`)];
      const outputNodes = [parseTS(`const x: string[] = ['a', 'b']`), parseTS(`const y: string[] = ['c', 'd']`)];
      const builderNode = new BuilderNode();
      const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`replace("declarationList.declarations.0.type", { with: "string[]" });`);
    });
  });
});