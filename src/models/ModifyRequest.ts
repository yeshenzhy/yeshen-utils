import { Query, QueryStatements } from "../query";

export class ModifyRequest<T> {
    /** 更新条件 */
    querierStatement: Query;
    /** 更新内容 */
    updated: T;
    /** 更新方法 */
    method?: string;

    /** 更新方法 */
    static build<T>(updated: T, buildQuery: () => Query) {
        const request = new ModifyRequest<T>();
        request.updated = updated;
        request.querierStatement = buildQuery();
        return request;
    }
}
