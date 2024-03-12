import DeepProxy from "proxy-deep";
import { ExprTypeEnum } from "./Enum";
import { Expr } from "./Expr";
import { Builder, BoolExprBuilder } from "./Interface";

/** 表达式构造器 */
export class ExprBuilder {
    constructor(public readonly ast: Expr) { }

    getExpr = () => this.ast;

    /** 并且 */
    and(e: ExprBuilder) {
        return new ExprBuilder(Expr.createBinaryExpression(ExprTypeEnum.and, this.ast, e.getExpr()));
    }
    /** 或者 */
    or(e: ExprBuilder) {
        return new ExprBuilder(Expr.createBinaryExpression(ExprTypeEnum.or, this.ast, e.getExpr()));
    }

    static getExprBuilder<T extends object>(predicate: (builder: Builder<T>) => BoolExprBuilder | undefined) {
        let names: string[] = [];
        /** 通过proxy进行参数的监听 */
        const builder = new DeepProxy<T>({} as T, {
            get(_, name: string) {
                names.push(name);
                return this.nest(function () { });
            },
            apply(_, __, argArray?) {
                const kind = names.pop();
                const expr = Expr.createValExpression(ExprTypeEnum[kind!], names.join("."), argArray[0]);
                names = [];
                return new ExprBuilder(expr);
            },
        }) as Builder<T>;
        const result = predicate(builder);
        return result!.getExpr();
    }
}
