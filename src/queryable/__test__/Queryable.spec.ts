/**
 * @vitest-environment happy-dom
 */
import { describe, expect, test } from "vitest";
import "reflect-metadata";
import { QueryableBuilder } from "../QueryableBuilder";

class TestA {
    attrsM?: string;
    attrsN?: string[];
}
class TestDemo {
    attrA: string;
    attrB: number;
    attrC: TestA;
    attrD?: number;
}

describe("测试QueryBuilder", () => {
    describe("正常 ", () => {
        // @vitest-environment happy-dom
        test("单个AND", async () => {
            const model1 = new TestDemo();
            model1.attrA = "bbb";
            const query = QueryableBuilder.create<TestDemo>()
                .where((it) =>
                    it.attrC.attrsM?.equal("attrsM")
                        .or(
                            it.attrA.equal("OR_attrA_1")
                                .and(it.attrA.equal("Or_AttrA_2"))
                        )
                        .and(it.attrA.equal("inner_and_1"))
                )
                .where((it) => it.attrA.equal("outer_and_1"))
                .build();
            console.log(query);

            expect(query).not.toBeUndefined();
        });
    });
});
