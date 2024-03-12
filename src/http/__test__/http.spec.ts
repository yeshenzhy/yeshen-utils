/**
 * @vitest-environment happy-dom
 */
import { RequestService } from '../';
import { describe, expect, test } from "vitest";
describe("测试Http请求", () => {
    describe("正常请求", () => {
        // @vitest-environment happy-dom
        test("创建新的请求", async () => {
            const request = new RequestService({
                baseURL: "https://op.dongrun-tech.com"
            }, {
                throttle: false,
                headerInvoke: (_headers) => { }
            });
            const res = await request.post("/v2/login");
            console.log(res);
            expect(res).not.toBeUndefined();
        });
    });
});
