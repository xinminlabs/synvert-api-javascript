import { Node } from "typescript";
import { BuilderNode } from "../../../lib/magic/builder";
import FindAndReplaceConverter from "../../../lib/magic/convert-pattern/find-and-replace-converter";
import FakeNode from "../../../lib/magic/fake-node";
import { parseJS, parseTS } from "../../test-helper";

describe("FindAndReplaceConverter", () => {
  const converter = new FindAndReplaceConverter([], [], new BuilderNode());

  describe("#findNames", () => {
    it("gets names", () => {
      const node = parseJS("$.isArray")["expression"];
      const targetNode = parseJS("isArray")["expression"];
      const names = converter["findNames"](node, targetNode);
      expect(names).toEqual(["name"]);
    });

    it("gets names in arguments", () => {
      const node = parseJS("$.isArray(foo, bar)")["expression"];
      const targetNode = parseJS("bar")["expression"];
      const names = converter["findNames"](node, targetNode);
      expect(names).toEqual(["arguments", "1"]);
    });

    it("gets names in declarations", () => {
      const node = parseTS('const x: string[] = ["a", "b"]');
      const targetNode = node["declarationList"]["declarations"][0]["initializer"]
      const names = converter["findNames"](node, targetNode);
      expect(names).toEqual(["declarationList", "declarations", "0", "initializer"]);
    });
  });

  describe("#deepUpdated", () => {
    it("updates node by names", () => {
      const node = parseJS("$.isArray(foo)")["expression"];
      const fakeNode = new FakeNode("foobar");
      converter["deepUpdated"](node, ["expression", "expression"], fakeNode);
      expect(node["expression"]["expression"]).toBeInstanceOf(FakeNode);
    });
  });

  describe("#getAllFakeNodes", () => {
    it("get all fake nodes", () => {
      const node = parseJS("$.isArray(foo)")["expression"];
      const fakeNode = new FakeNode("foobar");
      converter["deepUpdated"](node, ["expression", "expression"], fakeNode);
      const allFakeNodes = converter["getAllFakeNodes"](node);
      expect(allFakeNodes).toEqual([fakeNode]);
    });
  });

  describe("#generateSourceCode", () => {
    it("generates source code", () => {
      const node = parseJS("$.isArray(foo)")["expression"];
      const fakeNode = new FakeNode("{{expression.name}}");
      converter["deepUpdated"](node, ["expression", "name"], fakeNode);
      const sourceCode = converter["generateSourceCode"](node);
      expect(sourceCode).toEqual("$.{{expression.name}}(foo)");
    });
  });

  describe("#findAndReplace", () => {
    it("found if replaced node and target node are same", () => {
      const replacedNode = parseJS("$.isArray")["expression"];
      const targetNode = parseJS("$.isArray")["expression"];
      const [found, fakeNode] = converter["findAndReplace"](replacedNode, targetNode, "expression");
      expect(found).toBeTruthy();
      expect(fakeNode).toBeInstanceOf(FakeNode);
      expect((fakeNode as FakeNode).name).toEqual("{{expression}}");
    });

    it("found if target node is a sub target of replaced node", () => {
      const replacedNode = parseJS("$.isArray")["expression"];
      const targetNode = parseJS("isArray")["expression"];
      const [found, fakeNode] = converter["findAndReplace"](replacedNode, targetNode, "expression.name");
      expect(found).toBeTruthy();
      expect(fakeNode).not.toBeInstanceOf(FakeNode);
      expect((fakeNode as Node)["name"]).toBeInstanceOf(FakeNode);
    });
  });

  describe("#call", () => {
    it("generates replaceWith snippet", () => {
      const inputNodes = [parseJS("$.isArray(foo)")["expression"], parseJS("$.isArray(bar)")["expression"]];
      const outputNodes = [parseJS("jQuery.isArray(foo)")["expression"], parseJS("jQuery.isArray(bar)")["expression"]];
      const builderNode = new BuilderNode();
      const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`replaceWith("jQuery.{{expression.name}}({{arguments.0}})");`);
    });

    it("generates replaceWith snippet 2", () => {
      const inputNodes = [parseTS("const x: Array<string> = ['a', 'b']"), parseTS("const y: Array<string> = ['c', 'd']")];
      const outputNodes = [parseTS("const x: string[] = ['a', 'b']"), parseTS("const y: string[] = ['c', 'd']")];
      const builderNode = new BuilderNode();
      const converter = new FindAndReplaceConverter(inputNodes, outputNodes, builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual(`replaceWith("const {{declarationList.declarations.0.name}}: {{declarationList.declarations.0.type.typeArguments.0}}[] = {{declarationList.declarations.0.initializer}}");`);
    });
  });
});