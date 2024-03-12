import { ConditionStatement } from "./ConditionStatement";
import { QuerySymbolEnum } from "./Enum";

export class MatchStatement {
    constructor(
        op?: QuerySymbolEnum.and | QuerySymbolEnum.or,
        expressions?: MatchStatement[],
        statements?: ConditionStatement[]
    ) {
        if (!!op) {
            this.op = op;
        }
        if (!!expressions) {
            this.expressions = expressions;
        }
        if (!!statements) {
            this.statements = statements;
        }
    }
    /** 逻辑操作符 */
    op: QuerySymbolEnum.and | QuerySymbolEnum.or = QuerySymbolEnum.and;
    /** 表达式 */
    expressions?: MatchStatement[] = [];
    /** 条件 */
    statements?: ConditionStatement[] = [];
}
