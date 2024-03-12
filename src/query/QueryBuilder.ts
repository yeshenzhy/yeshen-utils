import { BasicType } from "../common";
import {
    SortStatement,
    QueryStatements,
    Condition,
    PageStatement,
    QueryExpression,
    UpdateStatements,
} from "./Condition";
import { QuerySortEnum, ExprTypeEnum } from "./Enum";
import { Expr } from "./Expr";
import { ExprBuilder } from "./ExprBuilder";
import { IQueryable, Builder, BoolExprBuilder } from "./Interface";
import DeepProxy from "proxy-deep";

/**
 * 使用方法
 * new UpdateStatementsBuilder<T>().where((it) => (it.id as any).equal(model.id)).build()
 */
export class UpdateStatementsBuilder<T extends object> {
    private exprs: Expr[] = [];
    private expressions: QueryExpression[] = [];

    /** 条件查询 */
    where(predicate: (builder: Builder<T>) => BoolExprBuilder | undefined) {
        this.exprs.push(ExprBuilder.getExprBuilder(predicate));
        return this;
    }
    /** 最终构建 */
    build(op: ExprTypeEnum.and | ExprTypeEnum.or = ExprTypeEnum.and): QueryStatements {
        if (this.exprs.length > 0) {
            const conditions: Condition[] = [];
            this.exprs.map((res) => {
                conditions.push(...res.build());
            });
            this.expressions.push({ op, statements: conditions });
        }
        const match = new QueryExpression(op, this.expressions);
        return new UpdateStatements(this.expressions.length > 0 ? match : undefined);
    }
}

/** 通用查询
 * 使用方式
 * @example  const query= new QueryBuilder<TestDemo>()
                .where((it) => it.attrA.equal("sss").and(it.attrA.equal("bbbb")))
                .and()
                .where((it) => it.attrB.lt(2))
                .or()
                .build()
 */
export class QueryBuilder<T extends object> implements IQueryable<T> {
    private exprs: Expr[] = [];
    private expressions: QueryExpression[] = [];
    private sortable: SortStatement[] = [];
    private pageStatement: { page: number; pageSize: number } = { page: 0, pageSize: 999999 };

    /** 最终构建
     *  @param innerBuild 是否`不`包含state查询，是否`不`包含 createTime排序，默认为false：包含
     */
    build(
        op: ExprTypeEnum.and | ExprTypeEnum.or = ExprTypeEnum.and,
        innerBuild: boolean = false
    ): QueryStatements {
        if (this.exprs.length > 0) {
            const conditions: Condition[] = [];
            this.exprs.map((res) => {
                conditions.push(...res.build());
            });
            this.expressions.push({ op, statements: conditions });
        }
        const match = new QueryExpression(op, this.expressions);
        return new QueryStatements(
            this.expressions.length > 0 ? match : undefined,
            this.sortable,
            this.pageStatement,
            innerBuild
        );
    }
    buildOr(): QueryStatements {
        return this.build(ExprTypeEnum.or);
    }
    /** 排序 */
    sort(predicate: (builder: Builder<T>) => void, sortable: QuerySortEnum): IQueryable<T> {
        let names: string[] = [];
        const builder = new DeepProxy<T>({} as T, {
            get(_, name: string) {
                names.push(name);
                return this.nest(function () { });
            },
        }) as Builder<T>;
        predicate(builder) as unknown as SortStatement;
        this.sortable.push(new SortStatement(sortable, names.join(".")));
        return this;
    }
    /** 分页查询 */
    page(page: number, pageSize: number) {
        this.pageStatement = new PageStatement(page, pageSize);
        return this;
    }
    /** 条件查询 */
    where(predicate: (builder: Builder<T>) => BoolExprBuilder | undefined): IQueryable<T> {
        this.exprs.push(ExprBuilder.getExprBuilder(predicate));
        return this;
    }
    /** 如果第一个条件未真，则执行后续处理 */
    whereIF(condition: BasicType, predicate: (builder: Builder<T>) => BoolExprBuilder): IQueryable<T> {
        if (condition) {
            return this.where(predicate);
        }
        return this;
    }
    and(): IQueryable<T> {
        const conditions: Condition[] = [];
        this.exprs.map((res) => {
            conditions.push(...res.build());
        });
        this.expressions.push({
            op: ExprTypeEnum.and,
            statements: conditions,
        });
        this.exprs = [];
        return this;
    }
    or(): IQueryable<T> {
        const conditions: Condition[] = [];
        this.exprs.map((res) => {
            conditions.push(...res.build());
        });
        this.expressions.push({
            op: ExprTypeEnum.or,
            statements: conditions,
        });
        this.exprs = [];
        return this;
    }
    whereOr(queryBuilder: IQueryable<T>): IQueryable<T> {
        const buildRes = queryBuilder.build(ExprTypeEnum.and, true);
        if (buildRes.match?.expressions) {
            this.expressions.push(new QueryExpression(ExprTypeEnum.or, buildRes.match.expressions));
        }
        return this;
    }
    whereAnd(queryBuilder: IQueryable<T>): IQueryable<T> {
        const res = queryBuilder.build(ExprTypeEnum.and, true);
        if (res.match?.expressions) {
            this.expressions.push(new QueryExpression(ExprTypeEnum.and, res.match.expressions));
        }
        return this;
    }

    /** 创建查询 */
    static create<T extends object>(): IQueryable<T> {
        return new QueryBuilder<T>();
    }

    static update() {
        return new UpdateStatementsBuilder();
    }
}
