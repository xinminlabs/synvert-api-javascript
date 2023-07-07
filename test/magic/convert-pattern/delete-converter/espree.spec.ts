import mock from "mock-fs";
import { BuilderNode } from "../../../../lib/magic/builder";
import DeleteConverter from "../../../../lib/magic/convert-pattern/delete-converter";
import { parseJsByEspree } from "../../../test-helper";

describe("DeleteConverter", () => {
  describe("#call", () => {
    describe("espree", () => {
      it("generates delete snippet", () => {
        const file1 = "code1.jsx";
        const source1 = `<Field name="email" type="email" autoComplete="email" />`;
        const file2 = "code2.jsx";
        const source2 = `<Field name="email" type="email" />`;
        try {
          mock({ [file1]: source1, [file2]: source2 });
          const builderNode = new BuilderNode();
          const converter = new DeleteConverter(
            [parseJsByEspree(source1, file1)["body"][0]["expression"], "code1.jsx"],
            [parseJsByEspree(source2, file2)["body"][0]["expression"], "code2.jsx"],
            builderNode
          );
          converter.call();
          expect(builderNode["children"].length).toEqual(1);
          expect(builderNode["children"][0].generateSnippet()).toEqual(`delete("openingElement.attributes.-1");`);
        } finally {
          mock.restore();
        }
      });
    });
  });
});
