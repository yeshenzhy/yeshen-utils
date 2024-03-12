import { BasicArray, BasicType } from "../common";
import { QueryStatements } from "./Condition";
import { ExprTypeEnum, QuerySortEnum } from "./Enum";
import { Expr } from "./Expr";
export interface StringExprBuilder {
    equal(s: string | StringExprBuilder): BoolExprBuilder;
    regex(s: string | StringExprBuilder): BoolExprBuilder;
    getExpr(): Expr;
}
export interface ArrayExprBuilder {
    in(s: any[] | ArrayExprBuilder): BoolExprBuilder;
    getExpr(): Expr;
}

export interface BoolExprBuilder {
    equal(s: boolean | BoolExprBuilder): BoolExprBuilder;
    and(e: BoolExprBuilder | undefined | null): BoolExprBuilder;
    or(e: BoolExprBuilder | undefined | null): BoolExprBuilder;
    getExpr(): Expr;
}

export interface NumberExprBuilder {
    equal(s: number | NumberExprBuilder): BoolExprBuilder;
    gt(s: number | NumberExprBuilder): BoolExprBuilder;
    gte(s: number | NumberExprBuilder): BoolExprBuilder;
    lt(s: number | NumberExprBuilder): BoolExprBuilder;
    lte(s: number | NumberExprBuilder): BoolExprBuilder;
    getExpr(): Expr;
}

export type Builder<T> = {
    [k in keyof T]: T[k] extends string | undefined | null
        ? StringExprBuilder
        : T[k] extends number | undefined | null
        ? NumberExprBuilder
        : T[k] extends BasicArray | undefined | null
        ? ArrayExprBuilder
        : T[k] extends Object
        ? Builder<T[k]>
        : BoolExprBuilder;
};

export interface IQueryable<T extends object> {
    where(predicate: (builder: Builder<T>) => BoolExprBuilder | undefined): IQueryable<T>;
    whereIF(
        condition: BasicType,
        predicate: (builder: Builder<T>) => BoolExprBuilder | undefined
    ): IQueryable<T>;
    and(): IQueryable<T>;
    or(): IQueryable<T>;
    sort(predicate: (builder: Builder<T>) => void, sortable: QuerySortEnum): IQueryable<T>;
    page(page: number, pageSize: number): IQueryable<T>;
    build(op?: ExprTypeEnum.and | ExprTypeEnum.or, innerBuild?: boolean): QueryStatements;
    buildOr(): QueryStatements;
    /**
     * @deprecated 废弃，此方法其实和where相同
     */
    whereAnd(queryBuilder: IQueryable<T>): IQueryable<T>;
    whereOr(queryBuilder: IQueryable<T>): IQueryable<T>;
}
