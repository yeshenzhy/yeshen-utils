import {
    SortStatement,
    QueryStatements,
    Condition,
    PageStatement,
    QueryExpression,
    BaseStatements,
} from "./Condition";
import { BasicType } from "../common";
import { QuerySortEnum, ExprTypeEnum } from "./Enum";
import { Expr } from "./Expr";
import { ExprBuilder } from "./ExprBuilder";
import { IQueryable, Builder, BoolExprBuilder } from "./Interface";
import DeepProxy from "proxy-deep";

/**
 * 使用方法
 * new BaseBuilder<T>().where((it) => (it.id as any).equal(model.id)).build()
 */
export class BaseBuilder<T extends object> {
    private exprs: Expr[] = [];
    private expressions: QueryExpression[] = [];
    private sortable: SortStatement[] = [];
    private pageStatement: { page: number; pageSize: number } | undefined;
    /** 条件查询 */
    where(predicate: (builder: Builder<T>) => BoolExprBuilder | undefined) {
        this.exprs.push(ExprBuilder.getExprBuilder(predicate));
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
    /** 排序 */
    sort(predicate: (builder: Builder<T>) => void, sortable: QuerySortEnum) {
        let names: string[] = [];
        const builder = new DeepProxy<T>({} as T, {
            get(_, name: string) {
                names.push(name);
                return this.nest(function () {});
            },
        }) as Builder<T>;
        predicate(builder) as unknown as SortStatement;
        this.sortable.push(new SortStatement(sortable, names.join(".")));
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

    /** 分页查询 */
    page(page: number, pageSize: number) {
        this.pageStatement = new PageStatement(page, pageSize);
        return this;
    }
    buildOr(): QueryStatements {
        return this.build(ExprTypeEnum.or);
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
        return new BaseStatements(
            this.expressions.length > 0 ? match : undefined,
            this.sortable,
            this.pageStatement
        );
    }
}
