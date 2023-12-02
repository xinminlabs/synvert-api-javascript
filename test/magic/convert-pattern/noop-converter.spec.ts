import { BuilderNode } from "../../../lib/magic/builder";
import NoopConverter from "../../../lib/magic/convert-pattern/noop-converter";

describe("NoopConverter", () => {
  describe("#call", () => {
    it("generates noop snippet", () => {
      const builderNode = new BuilderNode();
      const converter = new NoopConverter("typescript", [], [], builderNode);
      converter.call();
      expect(builderNode["children"].length).toEqual(1);
      expect(builderNode["children"][0].generateSnippet()).toEqual("noop();");
    });
  });
});