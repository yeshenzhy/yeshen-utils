import { RequestService } from "./../http/";
import { ClassConstructor, Exclude, instanceToPlain, plainToClassFromExist, plainToInstance } from "class-transformer";
import dayjs from "dayjs";
import { isArray, isObject, isString, resetObject } from "../common";
import {
    QueryBuilder,
    QuerySortEnum,
    StringExprBuilder,
    NumberExprBuilder,
    ArrayExprBuilder,
    Builder,
    BoolExprBuilder,
} from "../query";

import { BaseService } from "./BaseService";
import { BasicEntity, EntityStateEnum } from "./BasicEntity";
import { IBaseModel } from "./interfaces/IBaseModel";
import { ModifyRequest } from "./ModifyRequest";
import {  createIns } from "../inject";
import { injectable, inject } from "inversify";

@injectable()
export abstract class BasicModel extends BasicEntity implements IBaseModel {
    /** 基础service，不做对象保存
     * @deprecated 废弃，使用Service进行提交处理
     */
    @Exclude()
    baseService: BaseService<BasicEntity>;
    /** 初始化函数：子类必须实现此函数 */
    init(): void{};

    constructor(@inject(BaseService) service: BaseService<BasicEntity>) {
        super();
        this.baseService = service;
    }
    /** 重新设置Service
     * @deprecated 废弃，使用Service进行提交处理
     */
    setService(service: RequestService) {
        this.baseService.service = service;
    }
    /** 创建数据 
     * @deprecated 废弃，使用Service进行提交处理
    */
    async create(): Promise<boolean> {
        this.createTime = dayjs().valueOf();
        this.updateTime = dayjs().valueOf();
        const res = await this.baseService.create(instanceToPlain(this) as any);
        res.isSuccess && (this.id = res.data);
        return res.isSuccess;
    }
    /** 更新数据 
     * @deprecated 废弃，使用Service进行提交处理
    */
    async update(): Promise<boolean> {
        this.updateTime = dayjs().valueOf();
        const request = ModifyRequest.build<BasicEntity>(instanceToPlain(this) as any, () =>
            new QueryBuilder<BasicEntity>().where((it) => (it.id as any).equal(this.id)).build()
        );
        const res = await this.baseService.update(request);
        return res.isSuccess && res.data > 0;
    }
    /**  保存（有ID则保存，没有ID则新增）
     * @deprecated 废弃，使用Service进行提交处理
     */
    async save(): Promise<boolean> {
        this.updateTime = dayjs().valueOf();
        if (!!this.id) {
            return this.update();
        } else {
            return this.create();
        }
    }
    /** 根据ID删除 
     * @deprecated 废弃，使用Service进行提交处理
    */
    deleteById(): Promise<boolean> {
        this.state = EntityStateEnum.DELETED;
        return this.save();
    }
    /** 表格查询，会自动查询Count，带分页
     * @deprecated 废弃，使用Service进行提交处理
     */
    static async queryTable<T extends BasicEntity>(
        { page, sorts },
        request: Object,
        Service: ClassConstructor<BaseService<T>>,
        model: ClassConstructor<T>,
        requestService?: RequestService
    ): Promise<{ page: { total: number }; result: T[] }> {
        const where = new QueryBuilder<T>();
        where.page(page.currentPage, page.pageSize);
        if (request) {
            // 递归遍历request对象，拼接where条件
            this._queryBuilder(request, where);
        }
        sorts.map((sort) => {
            where.sort((it) => it[sort.field], QuerySortEnum[sort.order]);
        });
        const server = new Service();
        //如果传入了requestService，则使用 requestService
        if (!!requestService) {
            server.service = requestService;
        }
        const result = await server.query(where.build());
        return {
            page: { total: result.total },
            result: result.isSuccess ?
                    result.data.map(it=>plainToClassFromExist(createIns(model),it))
                    : [],
        };
    }
    /**
     * @deprecated 废弃，使用Service进行提交处理
     * @param obj 
     * @param where 
     * @param parentName 
     */
    static _queryBuilder<T extends BasicEntity>(obj: Object, where: QueryBuilder<T>, parentName = "") {
        //遍历对象，进行where条件拼接
        Object.entries(obj)
            .filter(
                ([key]) => !["pageNo", "pageSize", "keywords", "_baseService", "orderIndex"].includes(key)
            )
            .map(([key, val]) => {
                //如果request里的属性值为object类型，递归获取子属性，进行查询拼接
                const fullKey = parentName ? `${parentName}.${key}` : key;
                if (isObject(val)) {
                    this._queryBuilder(val, where, fullKey);
                    return;
                }
                //如果是字符串，则使用正则匹配
                if (isString(val)) {
                    where.where((it) => (it[fullKey] as StringExprBuilder).regex(val));
                    return;
                }
                //默认状态为0的，则不查询删除的数据
                if (key === "state" && val === 0) {
                    where.where((it) => (it.state as NumberExprBuilder).gte(0));
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
                where.where((it) => it[fullKey].equal(val));
            });
    }
    /** 按照条件查询
     * @deprecated 废弃，使用Service进行提交处理
     */
    static async queryItem<T extends BasicEntity>(
        predicate: (builder: Builder<T>) => BoolExprBuilder,
        Service: ClassConstructor<BaseService<T>>,
        model: ClassConstructor<T>,
        requestService?: RequestService
    ): Promise<T[]> {
        const server = new Service();
        //如果传入了requestService，则使用requestService
        if (!!requestService) {
            server.service = requestService;
        }
        const result = await server.queryItem(predicate);
        return result.isSuccess ?
                result.data.map(it=>plainToClassFromExist(createIns(model),it)) 
                    : [];
    }
    /** 设置所有属性为null值 */
    reset() {
        resetObject(this);
    }
}
