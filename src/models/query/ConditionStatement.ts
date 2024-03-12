import { QuerySymbolEnum } from "./Enum";
import { MatchStatement } from "./MatchStatement";

export class ConditionStatement {
    /** 符号 */
    symbol: string;
    /** 参数名 */
    fieldName: string;
    /** 参数值 */
    value: any;

    /** 创建表达式 */
    static createBinaryExpression(
        kind: QuerySymbolEnum,
        left: ConditionStatement,
        right: ConditionStatement
    ) {
        const expr = new ConditionStatement();
        expr.symbol = kind;
        expr.value = [left, right];
        return expr;
    }
    /** 创建值表达式 */
    static createValExpression(symbol: string, fieldName: string, value: any) {
        const expr = new ConditionStatement();
        expr.value = value;
        expr.fieldName = fieldName;
        expr.symbol = symbol;
        return expr;
    }
    build () {
        const match: MatchStatement = new MatchStatement();
        if (this.symbol === QuerySymbolEnum.and || this.symbol === QuerySymbolEnum.or) {
            match.op = this.symbol;
            match.expressions = this.value.map((res: ConditionStatement) => {
                return res.build();
            });
        } else {
            match.statements?.push(this);
        }
        return match;
    };
}
