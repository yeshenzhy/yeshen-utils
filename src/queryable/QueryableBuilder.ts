import DeepProxy from "proxy-deep";
import {
    ConditionStatement,
    MatchStatement,
    PaginateStatement,
    QuerySortableEnum,
    QuerySymbolEnum,
    QueryableStatement,
    SortableStatement,
} from "../models";
import { BasicTypeQueryable, BoolBuilder, BuilderQueryable, IQueryableBuilder } from "./Interface";
import { QueryExprBuilder } from "./QueryExprBuilder";

/** 新的查询 */
export class QueryableBuilder<T extends object> implements IQueryableBuilder<T> {
    /** 查询条件（可包含多级，多个and、or） */
    private exprs: ConditionStatement[] = [];
    private sortable: SortableStatement[] = [];
    private pageStatement: PaginateStatement = { page: 0, pageSize: 999999 };
    private matchStatement: MatchStatement = new MatchStatement();

    /** 创建查询 */
    static create<T extends object>(): IQueryableBuilder<T> {
        return new QueryableBuilder<T>();
    }

    /** 最终构建
     *  @param innerBuild 是否`不`包含state查询，是否`不`包含 createTime排序，默认为false：包含
     */
    build(innerBuild: boolean = false) {
        if (this.exprs.length > 0) {
            this.exprs.map((res) => {
                const expr = res.build();
                this.matchStatement.expressions?.push(expr);
            });
        }
        return new QueryableStatement(this.matchStatement, this.sortable, this.pageStatement, innerBuild);
    }
    where(predicate: (builder: BuilderQueryable<T>) => BoolBuilder | undefined): IQueryableBuilder<T> {
        this.exprs.push(QueryExprBuilder.getExprBuilder(predicate));
        return this;
    }
    whereIF(
        condition: BasicTypeQueryable,
        predicate: (builder: BuilderQueryable<T>) => BoolBuilder | undefined
    ): IQueryableBuilder<T> {
        if (!!condition) {
            return this.where(predicate);
        }
        return this;
    }

    sort(
        predicate: (builder: BuilderQueryable<T>) => void,
        sortable: QuerySortableEnum
    ): IQueryableBuilder<T> {
        let names: string[] = [];
        const builder = new DeepProxy<T>({} as T, {
            get(_, name: string) {
                names.push(name);
                return this.nest(function () {});
            },
        }) as BuilderQueryable<T>;
        predicate(builder) as unknown as SortableStatement;

        this.sortable.push(new SortableStatement(sortable, names.join(".")));
        return this;
    }
    page(page: number, pageSize: number): IQueryableBuilder<T> {
        this.pageStatement = new PaginateStatement(page, pageSize);
        return this;
    }

    whereOr(queryBuilder: IQueryableBuilder<T>): IQueryableBuilder<T> {
        const buildRes = queryBuilder.build(true);

        if (buildRes.match?.expressions) {
            this.matchStatement.expressions?.push(
                new MatchStatement(QuerySymbolEnum.or, buildRes.match.expressions)
            );
        }
        return this;
    }
    whereAnd(queryBuilder: IQueryableBuilder<T>): IQueryableBuilder<T> {
        const res = queryBuilder.build(true);
        if (res.match?.expressions) {
            this.matchStatement.expressions?.push(
                new MatchStatement(QuerySymbolEnum.and, res.match.expressions)
            );
        }
        return this;
    }
}
