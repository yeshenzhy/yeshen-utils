import { Condition } from "./Condition";
import { ExprTypeEnum } from "./Enum";

/** 表达式处理 */
export class Expr {
    /** 创建表达式 */
    static createBinaryExpression(kind: ExprTypeEnum, left: Expr, right: Expr) {
        const expr = new Expr();
        expr.kind = kind;
        expr.left = left;
        expr.right = right;
        return expr;
    }
    /** 创建值表达式 */
    static createValExpression(kind, left, right: any) {
        const expr = new Expr();
        //处理各种值，包括 array，dateTime 等
        expr.kind = kind;
        expr.left = left;
        expr.right = right;
        return expr;
    }
    kind: ExprTypeEnum;
    /** 左侧值 */
    left: Expr | string;
    /** 右侧值 */
    right: Expr | any;
    /** 构建 */
    build(): Condition[] {
        const conditions: Condition[] = [];
        //有子项
        if (this.kind === ExprTypeEnum.and) {
            //处理子项
            if (this.left instanceof Expr) {
                conditions.push(...this.left.build());
            }
            if (this.right instanceof Expr) {
                conditions.push(...this.right.build());
            }
        } else if (this.left instanceof Expr && this.right instanceof Expr) {
            if (
                typeof this.left.left === "string" &&
                this.right.right !== "" &&
                this.right.right !== undefined &&
                this.right.right !== null
            ) {
                conditions.push(new Condition(this.kind, this.left.left, this.right.right));
            }
        } else if (typeof this.left === "string") {
            if (this.right !== "" && this.right !== undefined && this.right !== null) {
                conditions.push(new Condition(this.kind, this.left, this.right));
            }
        }
        return conditions;
    }
}
