import { BasicEntity } from "../models/BasicEntity";
import { ExprTypeEnum, QuerySortEnum } from "./Enum";
import { some } from "lodash-es";

/** 查询条件 */
export class Condition {
    constructor(symbol: string, fieldName: string, value: any) {
        this.symbol = symbol;
        this.fieldName = fieldName;
        this.value = value;
    }
    /** 符号 */
    symbol: string;
    /** 参数名 */
    fieldName: string;
    /** 参数值 */
    value: any;
}

/** 排序结构 */
export class SortStatement {
    constructor(symbol: QuerySortEnum, fieldName: string) {
        this.symbol = symbol;
        this.fieldName = fieldName;
    }
    /** 排序顺序 */
    symbol: QuerySortEnum;
    /** 参数名 */
    fieldName: string;
}
/** 分页结构 */
export class PageStatement {
    constructor(page: number, pageSize: number) {
        this.page = page - 1 < 0 ? 0 : page - 1;
        this.pageSize = pageSize;
    }
    /** 当前页 */
    page: number;
    /** 每页显示 */
    pageSize: number;
}

export class Query {
    match?: QueryExpression;
    sort?: SortStatement[];
    page?: PageStatement;
}
/** 查询结构 */
export class QueryStatements extends Query {
    constructor(
        match?: QueryExpression,
        sortStatement?: SortStatement[],
        page?: PageStatement,
        innerBuild: boolean = false
    ) {
        super();
        /** 包含操作符 */
        if (match?.op) {
            this.match = match;
        }
        /** 没有筛选条件，或者筛选条件没有state,增加state条件 */
        if (!this.match || !some(this.match.statements, (it) => it.fieldName === "state")) {
            if (!this.match) {
                this.match = new QueryExpression(ExprTypeEnum.and, []);
            }
            if (!this.match.expressions) {
                this.match.expressions = [];
            }
            // 默认增加state条件,但是state条件应该只在外层增加
            if (!innerBuild) {
                this.match.expressions.push({
                    op: ExprTypeEnum.and,
                    statements: [BasicEntity.statements()],
                });
                //深度移除 expressions 为空的表达式
                const deep = (expressions: QueryExpression[]) => {
                    expressions.forEach((item, index) => {
                        if (item.expressions?.length === 0) {
                            expressions.splice(index, 1);
                            deep(expressions);
                            return;
                        } else if (item.expressions?.length) {
                            deep(item.expressions!);
                        }
                    });
                };
                deep(this.match.expressions);
                // 默认使用createTime进行查询
                if (sortStatement?.length === 0) {
                    sortStatement = [{ fieldName: "createTime", symbol: QuerySortEnum.desc }];
                }
            }
        }

        if (this.match.expressions?.length === 0) {
            delete this.match.expressions;
        }
        if (this.match.statements?.length === 0) {
            delete this.match.statements;
        }
        this.sort = sortStatement;
        this.page = page;
    }
}

export class QueryExpression {
    constructor(op: ExprTypeEnum.and | ExprTypeEnum.or, expressions: QueryExpression[]) {
        this.op = op;
        this.expressions = expressions;
    }
    /** 逻辑操作符 */
    op: ExprTypeEnum.and | ExprTypeEnum.or;
    /** 表达式 */
    expressions?: QueryExpression[];
    /** 条件 */
    statements?: Condition[];
}

export class UpdateStatements extends Query {
    constructor(match: QueryExpression | undefined, sortStatement?: SortStatement[], page?: PageStatement) {
        super();
        this.match = match;
        this.sort = sortStatement;
        this.page = page;
    }
}

export class BaseStatements extends Query {
    constructor(match?: QueryExpression, sortStatement?: SortStatement[], page?: PageStatement) {
        super();
        /** 包含操作符 */
        if (match?.op) {
            this.match = match;
        }
        //深度移除 expressions 为空的表达式
        const deep = (expressions: QueryExpression[]) => {
            expressions.forEach((item, index) => {
                if (item.expressions?.length === 0) {
                    expressions.splice(index, 1);
                    deep(expressions);
                    return;
                } else if (item.expressions?.length) {
                    deep(item.expressions!);
                }
            });
        };
        deep(this.match?.expressions ?? []);

        this.sort = sortStatement;
        this.page = page;
    }
}
