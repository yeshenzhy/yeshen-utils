import { RequestService } from "../../http";
import { RequestResult } from "../../common";
import { BoolExprBuilder, Builder, QueryBuilder, QueryStatements } from "../../query";
import { ModifyRequest } from "../ModifyRequest";

/** 基类的定义 */
export interface IBaseService<T extends Object> {
    /** URL 前缀 */
    prefixUrl: string;
    /**  基础请求服务 */
    service: RequestService;
    /** 创建数据 */
    create(entity: T): Promise<RequestResult<string>>;
    /** 更新数据 */
    update(request: ModifyRequest<T>): Promise<RequestResult<number>>;
    /** 根据条件查询 */
    query(query: QueryStatements): Promise<RequestResult<T[]>>;
    /** 根据条件查询全部 */
    queryAll(query: QueryStatements): Promise<RequestResult<T[]>>;
    /** 根据条件查询 */
    queryItem(predicate: (builder: Builder<T>) => BoolExprBuilder): Promise<RequestResult<T[]>>;
    /** 根据条件查询总数 */
    queryCount(query: QueryStatements): Promise<RequestResult<number>>;
}
