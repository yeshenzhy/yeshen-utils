/**
 * @vitest-environment happy-dom
 */
import { describe, expect, test } from "vitest";
import { QueryBuilder } from "../QueryBuilder";

class TestDemo {
    attrA: string;
    attrB: number;
    attrC: string;
    attrD?: number;
}
describe("测试QueryBuilder", () => {
    describe("正常 ", () => {
        // @vitest-environment happy-dom
        test("单个AND", async () => {
            const model1 = new TestDemo();
            model1.attrA = "bbb";
            const builder2 = new QueryBuilder<TestDemo>().where((it) => it.attrA.equal("sss"));
            const query = new QueryBuilder<TestDemo>()
                .where((it) => it.attrA.equal("sss").and(it.attrA.equal("bbbb")))
                .whereIF(model1.attrA === "bbb", (it) => it.attrA.equal("bbbb"))
                .whereOr(builder2)
                .build();

            console.log(query);

            expect(query).not.toBeUndefined();
        });
    });
});
