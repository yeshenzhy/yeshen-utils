import DeepProxy from "proxy-deep";
import { BoolBuilder, BuilderQueryable } from "./Interface";
import { QuerySymbolEnum, ConditionStatement } from "../models/";

export class QueryExprBuilder {
    constructor(public readonly ast: ConditionStatement) { }

    getExpr = () => this.ast;
    /** 并且 */
    and(e: QueryExprBuilder) {
        return new QueryExprBuilder(
            ConditionStatement.createBinaryExpression(QuerySymbolEnum.and, this.ast, e.getExpr())
        );
    }
    /** 或者 */
    or(e: QueryExprBuilder) {
        return new QueryExprBuilder(
            ConditionStatement.createBinaryExpression(QuerySymbolEnum.or, this.ast, e.getExpr())
        );
    }

    static getExprBuilder<T extends object>(predicate: (builder: BuilderQueryable<T>) => BoolBuilder | undefined) {
        let names: string[] = [];
        /** 通过proxy进行参数的监听 */
        const builder = new DeepProxy<T>({} as T, {
            get(_, name: string) {
                names.push(name);
                return this.nest(function () { });
            },
            apply(_, __, argArray?) {
                const kind = names.pop();
                const expr = ConditionStatement.createValExpression(
                    QuerySymbolEnum[kind!],
                    names.join("."),
                    argArray[0]
                );
                names = [];
                return new QueryExprBuilder(expr);
            },
        }) as BuilderQueryable<T>;
        const result = predicate(builder);
        return result!.getExpr();
    }
}
