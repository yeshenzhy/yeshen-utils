import { ConditionStatement } from "./ConditionStatement";
import { QuerySortableEnum, QuerySymbolEnum } from "./Enum";
import { MatchStatement } from "./MatchStatement";
import { PaginateStatement } from "./PaginateStatement";
import { SortableStatement } from "./SortableStatement";
import { some } from "lodash-es";

/** 查询结构 */
export class QueryableStatement {
    constructor(
        match?: MatchStatement,
        sortStatement?: SortableStatement[],
        page?: PaginateStatement,
        innerBuild: boolean = false
    ) {
        if (!!match) {
            this.match = match;
        }
        if (!this.match || !some(this.match.statements, (it) => it.fieldName === "state")) {
            if (!this.match) {
                this.match = new MatchStatement();
            }
            // 默认增加state条件,但是state条件应该只在外层增加
            if (!innerBuild) {
                this.match.expressions?.push({
                    op: QuerySymbolEnum.and,
                    expressions: [],
                    statements: [ConditionStatement.createValExpression(QuerySymbolEnum.gte, "state", 0)],
                });
                //深度移除 expressions 为空的表达式
                const deep = (expressions: MatchStatement[]) => {
                    expressions.forEach((item, index) => {
                        if (item.expressions?.length === 0) {
                            delete item.expressions;
                        }
                        if (item.statements?.length === 0) {
                            delete item.statements;
                        }
                        if (item.expressions?.length === 0 && item.statements?.length === 0) {
                            expressions.splice(index, 1);
                            deep(expressions);
                            return;
                        } else if (item.expressions?.length) {
                            deep(item.expressions);
                        }
                    });
                };
                deep(this.match.expressions!);

                // 默认使用createTime进行查询
                if (sortStatement?.length === 0) {
                    sortStatement = [{ fieldName: "createTime", symbol: QuerySortableEnum.desc }];
                }
            }
        }

        if (this.match.expressions?.length === 0) {
            delete this.match.expressions;
        }
        if (this.match.statements?.length === 0) {
            delete this.match.statements;
        }
        this.sort = sortStatement;
        this.page = page;
    }
    /** 查询条件 */
    match?: MatchStatement;
    /** 排序条件 */
    sort?: SortableStatement[];
    /** 分页条件 */
    page?: PaginateStatement = new PaginateStatement(0, 99999);
}
