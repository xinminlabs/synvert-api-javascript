import * as Utils from "../../lib/magic/utils";
import { parseJS } from "../test-helper";

describe("Utils", () => {
  describe(".getNodeType", () => {
    it("gets node type text", () => {
      const node = parseJS("$.isArray(foo)");
      expect(Utils.getNodeType(node)).toEqual("CallExpression");
    });
  });

  describe("isNode", () => {
    it("gets true if it is a node", () => {
      const node = parseJS("$.isArray(foo)");
      expect(Utils.isNode(node)).toBeTruthy();
    });

    it("gets false if it is a node", () => {
      expect(Utils.isNode("foobar")).toBeFalsy();
    });
  });

  describe("allNodes", () => {
    it("gets true if all are Node", () => {
      const node = parseJS("$.isArray(foo)");
      expect(Utils.allNodes([node, node])).toBeTruthy();
    });

    it("gets false if not all are Node", () => {
      const node = parseJS("$.isArray(foo)");
      expect(Utils.allNodes([node, "foo"])).toBeFalsy();
    });
  });

  describe("allArrays", () => {
    it("gets true if all are Array", () => {
      expect(Utils.allArrays([["foo"], ["bar"]])).toBeTruthy();
    });

    it("gets false if not all are Array", () => {
      expect(Utils.allArrays([["foo"], "bar"])).toBeFalsy();
    });
  });

  describe("allEqual", () => {
    it("gets true if all elements are same in array", () => {
      expect(Utils.allEqual(["foo", "foo"])).toBeTruthy();
    });

    it("gets false if not all elements are same in array", () => {
      expect(Utils.allEqual(["foo", "bar"])).toBeFalsy();
    });
  });

  describe("allNodeTypeEqual", () => {
    it("gets true if all node types are same", () => {
      const node1 = parseJS("$.isArray(foo)");
      const node2 = parseJS("$.isArray(bar)");
      expect(Utils.allNodeTypeEqual([node1, node2])).toBeTruthy();
    });

    it("gets false if not all node types are same", () => {
      const node1 = parseJS("$.isArray(foo)");
      const node2 = parseJS("true");
      expect(Utils.allNodeTypeEqual([node1, node2])).toBeFalsy();
    });
  });
});