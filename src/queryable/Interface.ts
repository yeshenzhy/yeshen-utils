import { ConditionStatement, QuerySortableEnum, QueryableStatement } from "../models";

export interface StringBuilder {
    equal(s: string | StringBuilder): BoolBuilder;
    notEqual(s: string | StringBuilder): BoolBuilder;
    regex(s: string | StringBuilder): BoolBuilder;
    in(s: any[] | StringBuilder): BoolBuilder;
    getExpr(): ConditionStatement;
}
export interface ArrayBuilder {
    in(s: any[] | ArrayBuilder): BoolBuilder;
    getExpr(): ConditionStatement;
}

export interface BoolBuilder {
    equal(s: boolean | BoolBuilder): BoolBuilder;
    notEqual(s: boolean | BoolBuilder): BoolBuilder;
    and(e: BoolBuilder | undefined | null): BoolBuilder;
    or(e: BoolBuilder | undefined | null): BoolBuilder;
    getExpr(): ConditionStatement;
}

export interface NumberBuilder {
    equal(s: number | NumberBuilder): BoolBuilder;
    notEqual(s: number | NumberBuilder): BoolBuilder;
    gt(s: number | NumberBuilder): BoolBuilder;
    gte(s: number | NumberBuilder): BoolBuilder;
    lt(s: number | NumberBuilder): BoolBuilder;
    lte(s: number | NumberBuilder): BoolBuilder;
    in(s: any[] | NumberBuilder): BoolBuilder;
    getExpr(): ConditionStatement;
}

export type BasicArrayQueryable = Array<string | number | boolean>;
export type BasicTypeQueryable = number | string | boolean | BasicArrayQueryable;

export type BuilderQueryable<T> = {
    [k in keyof T]: T[k] extends string | undefined | null
    ? StringBuilder
    : T[k] extends number | undefined | null
    ? NumberBuilder
    : T[k] extends BasicArrayQueryable | undefined | null
    ? ArrayBuilder
    : T[k] extends Object
    ? BuilderQueryable<T[k]>
    : BoolBuilder;
};

export interface IQueryableBuilder<T extends object> {
    where(predicate: (builder: BuilderQueryable<T>) => BoolBuilder | undefined): IQueryableBuilder<T>;
    whereIF(
        condition: BasicTypeQueryable,
        predicate: (builder: BuilderQueryable<T>) => BoolBuilder | undefined
    ): IQueryableBuilder<T>;
    sort(predicate: (builder: BuilderQueryable<T>) => void, sortable: QuerySortableEnum): IQueryableBuilder<T>;
    page(page: number, pageSize: number): IQueryableBuilder<T>;
    build(innerBuild?: boolean): QueryableStatement;

    whereAnd(queryBuilder: IQueryableBuilder<T>): IQueryableBuilder<T>;
    whereOr(queryBuilder: IQueryableBuilder<T>): IQueryableBuilder<T>;
}
