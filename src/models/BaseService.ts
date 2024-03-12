import { IBaseService } from "./interfaces/";
import { RequestService } from "../http";
import {
    ArrayExprBuilder,
    BoolExprBuilder,
    Builder,
    NumberExprBuilder,
    QueryBuilder,
    QuerySortEnum,
    QueryStatements,
    StringExprBuilder,
    UpdateStatementsBuilder,
} from "../query";
import { BasicJpaEntity, QueryableStatement } from "../models";

import { ModifyRequest } from "./ModifyRequest";
import { ServiceConfig } from "./ServiceConfig";
import { ClassConstructor, plainToInstance, instanceToPlain } from "class-transformer";
import { InjectTypes, Nullable, isArray, isObject, isString } from "../common";
import { inject, injectable } from "inversify";
import { BasicEntity, EntityStateEnum } from "./BasicEntity";
import { get } from "lodash-es";
import dayjs from "dayjs";
import { ArrayString } from "../common/ArrayString";

@injectable()
export class BaseService<T extends BasicEntity | BasicJpaEntity> implements IBaseService<T> {
    constructor(@inject(InjectTypes.ServiceConfig) public config: Nullable<ServiceConfig>) {
        if (config) {
            this.service = new RequestService(
                {
                    baseURL: config.baseUrl,
                },
                {
                    headerInvoke: config.headerInvoke,
                    adapter: config.adapter,
                    throttle: true,
                    backendConfig: config.backendConfig,
                    useResponseInterceptor: config.useResponseInterceptor ?? true,
                    handleBackendError: config.handleBackendError,
                    handleResponseError: config.handleResponseError,
                }
            );
        }
    }

    /** URL 前缀 */
    prefixUrl: string;
    /**  基础请求服务 */
    service: RequestService;
    /** 基础查询 */
    async query<T extends Object>(query: QueryStatements | QueryableStatement) {
        const res = await this.service.post<T[]>(`${this.prefixUrl}/query`, query);
        const countRes = await this.queryCount(query);
        res.total = countRes.isSuccess ? countRes.data : 0;
        return res;
    }
    /** 基础查询,查询全部 */
    async queryAll<T extends Object>(query: QueryStatements | QueryableStatement) {
        const res = await this.service.post<T[]>(`${this.prefixUrl}/query`, query);
        return res;
    }
    /** 查询总数 */
    async queryCount(query: QueryStatements | QueryableStatement) {
        delete query.page;
        return await this.service.post<number>(`${this.prefixUrl}/query/count`, query);
    }

    /** 查询单个可以使用这个，它不查count方法 */
    async queryItem<T extends Object>(predicate: (builder: Builder<T>) => BoolExprBuilder) {
        const query = new QueryBuilder<T>().where(predicate).build();
        return await this.service.post<T[]>(`${this.prefixUrl}/query`, query);
    }
    /** 基础添加 */
    async create<T extends BasicEntity | BasicJpaEntity>(model: T) {
        model.createTime = dayjs().valueOf();
        model.updateTime = dayjs().valueOf();
        model.method = "create";
        return await this.service.post<string>(`${this.prefixUrl}/create`, model);
    }
    /** 基础修改 */
    async update<T extends BasicEntity | BasicJpaEntity>(request: ModifyRequest<T> | T) {
        return await this.service.post<number>(`${this.prefixUrl}/update`, request);
    }
    /** 根据ID修改 */
    async updateById<T extends BasicEntity | BasicJpaEntity>(model: T, method?: string) {
        model.updateTime = dayjs().valueOf();
        model.method = method || "update";

        if (model instanceof BasicJpaEntity) {
            return await this.update(model);
        } // else if(model instanceof BasicEntity)
        else {
            const request = ModifyRequest.build<T>(instanceToPlain(model) as any, () =>
                new UpdateStatementsBuilder<T>().where((it) => (it.id as any).equal(model.id)).build()
            );
            return await this.update(request);
        }
    }
    /** 根据ID删除 */
    async deleteById<T extends BasicEntity | BasicJpaEntity>(model: T) {
        model.state = EntityStateEnum.DELETED;
        return await this.updateById(model, "delete");
    }
    /** 新版修改 */
    async updateItem<T extends BasicEntity | BasicJpaEntity>(model: T, method?: string) {
        model.updateTime = dayjs().valueOf();
        model.method = method || "update";
        return await this.service.post<number>(`${this.prefixUrl}/update`, model);
    }
    /** 新版删除 */
    async deleteItem<T extends BasicEntity | BasicJpaEntity>(model: T) {
        model.state = EntityStateEnum.DELETED;
        model.method = "delete";
        return await this.service.post<number>(`${this.prefixUrl}/update`, model);
    }
    /** 新版废弃 */
    async discardItem<T extends BasicEntity | BasicJpaEntity>(model: T) {
        model.state = EntityStateEnum.DISCARD;
        model.method = "discard";
        return await this.service.post<number>(`${this.prefixUrl}/update`, model);
    }

    /** 保存， 根据ID进行判断，如果有ID，则保存*/
    async save<T extends BasicEntity | BasicJpaEntity>(model: T, method?: string) {
        if (!!model.id) {
            return this.updateById(model, method);
        } else {
            if (model instanceof BasicJpaEntity) {
                !model.orgDomainIds ? (model.orgDomainIds = this.config?.dataConfig?.currentOrgId) : null;
            } else if (model instanceof BasicEntity) {
                !model.orgDomainIds ? (model.orgDomainIds = [this.config?.dataConfig?.currentOrgId]) : null;
            }
            !model.platformDomainId
                ? (model.platformDomainId = this.config?.dataConfig?.platformDomainId)
                : null;
            return this.create(model);
        }
    }

    /** 表格查询，会自动查询Count，带分页 */
    async queryTable<T extends BasicEntity | BasicJpaEntity>(
        { page, sorts },
        request: Object,
        model: ClassConstructor<T>,
        initSort?: Nullable<{ key: string; order: QuerySortEnum }>,
        queryBuilder?: QueryBuilder<any>
    ): Promise<{ page: { total: number }; result: T[] }> {
        const where = queryBuilder || new QueryBuilder<T>();
        where.page(page.currentPage, page.pageSize);

        if (request) {
            // 递归遍历request对象，拼接where条件
            this._queryBuilder(request, where);
        }
        if (sorts.length > 0) {
            sorts.map((sort) => {
                where.sort((it) => it[sort.field], QuerySortEnum[sort.order]);
            });
        } else if (initSort) {
            where.sort((it) => get(it, initSort.key), initSort.order);
        }

        const result = await this.query(where.build());
        return {
            page: { total: result.total },
            result: result.isSuccess ? plainToInstance(model, result.data) : [],
        };
    }
    private _queryBuilder<T extends BasicEntity | BasicJpaEntity>(
        obj: Object,
        where: QueryBuilder<T>,
        parentName = ""
    ) {
        //遍历对象，进行where条件拼接
        Object.entries(obj)
            .filter(([key]) => !["pageNo", "pageSize", "keywords", "baseService", "orderIndex"].includes(key))
            .map(([key, val]) => {
                //如果值为空或者为空字符串，则不进行查询
                if (val === null || val === "") {
                    return;
                }
                //如果request里的属性值为object类型，递归获取子属性，进行查询拼接
                const fullKey = parentName ? `${parentName}.${key}` : key;
                if (key.startsWith("__")) {
                    const startKey = (parentName ? `${parentName}.${key}` : key).replace("__", "");
                    where.where((it) => (it[startKey] as NumberExprBuilder).gte(val));
                    return;
                }
                if (key.endsWith("__")) {
                    const endKey = (parentName ? `${parentName}.${key}` : key).replace("__", "");
                    where.where((it) => (it[endKey] as NumberExprBuilder).lte(val));
                    return;
                }
                if (isObject(val)) {
                    this._queryBuilder(val, where, fullKey);
                    return;
                }
                //如果是字符串，则使用正则匹配
                if (isString(val)) {
                    // 如果使用特殊字段开头，则精准查询
                    if (key.startsWith("_EQ_")) {
                        const realKey = (parentName ? `${parentName}.${key}` : key).replace("_EQ_", "");
                        where.where((it) => (it[realKey] as StringExprBuilder).equal(val));
                    } else {
                        where.where((it) => (it[fullKey] as StringExprBuilder).regex(val));
                    }
                    return;
                }
                //默认状态为0的，则不查询删除的数据
                if (key === "state" && val === 0) {
                    where.where((it) => (it[key] as NumberExprBuilder).gte(val));
                    return;
                }
                // 如果request里的属性值为数组类型，并且此属性没有任何子属性，则不作为查询条件
                if (isArray(val)) {
                    if (val.length === 0) {
                        return;
                    } else {
                        where.where((it) => (it[fullKey] as ArrayExprBuilder).in(val));
                        return;
                    }
                }
                if (val instanceof ArrayString) {
                    // where.where(it => {
                    //     return val.value.map(el=>{
                    //         it.or((it) =>(it[fullKey] as StringExprBuilder).regex(`|${el}|`))
                    //     });
                    // });
                    val.value.map((el) => {
                        where.where((it) => (it[fullKey] as StringExprBuilder).regex(`|${el}|`));
                    });
                    return;
                }
                where.where((it) => it[fullKey].equal(val));
            });
    }
}
