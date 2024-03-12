import dayjs from "dayjs";
import { Nullable, TIME_FORMAT } from "../common";

export abstract class BasicEntity {
    /** 初始化函数，继承此类必须重写此函数 */
    abstract init(): void;
    /** ID  */
    id: string;
    /**
     * 数据授权（身份）
     * 身份集合
     * 此临时授权 高于 可见性
     * <p>
     * 角色、身份实体无此逻辑
     */
    accredit: MapStringArray = new MapStringArray();
    /**
     * 平台领域
     * 单字母，一般服务端配置，设置时手动写入
     * 必须
     */
    platformDomainId: Nullable<string> = null;
    /** 组织域 */
    orgDomainIds: string[] = [];
    /**
     * 归属域
     * 可见性标签默认
     */
    ascriptionDomain: MapStringArray = new MapStringArray();
    /**
     * 自定义标签
     */
    customTags: MapStringArray = new MapStringArray();
    /** 业务域 */
    bizDomainIds: string[] = [];
    /** 附加业务分类 */
    additionalBizDomainIds: string[] = [];
    /**
     * 创造者身份。
     */
    creatorIdentity: Nullable<string> = null;
    /**
     * 创造者名称。
     */
    creatorName: Nullable<string> = null;
    /**
     * 修改者身份
     */
    menderIdentity: Nullable<string> = null;
    /**
     * 修改者名称
     */
    menderName: Nullable<string> = null;
    /**
     * 修改代理人
     * 运营者账号ID
     */
    menderProxy: Nullable<string> = null;
    /**
     * 创建者代理人
     */
    creatorProxy: Nullable<string> = null;
    /**
     * 排序（序号）
     */
    orderIndex = 999999.0;
    /**
     * 状态.
     */
    state: EntityStateEnum = EntityStateEnum.ENABLE;
    /**
     * 数据契约id。
     */
    dataContractId: Nullable<string[]> | Nullable<string> = null;

    /**
     * 数据契约版本号
     */
    dataContractVersion: string = "v1";
    /**
     * 版本号
     */
    version: number;

    /**
     * 创建时间。毫秒
     */
    createTime: number;
    /** 创建时间时间 */
    get createTimeStr() {
        return dayjs(this.createTime).format(TIME_FORMAT);
    }
    /**
     * 更新时间。毫秒
     */
    updateTime: number;
    /** 更新时间 */
    get updateTimeStr() {
        return dayjs(this.updateTime).format(TIME_FORMAT);
    }
    /** 更新操作 */
    method: string = "";

    /** 默认：通用查询条件 */
    static statements() {
        return { fieldName: "state", symbol: "GTE", value: 0 };
    }
}
export class MapStringArray {
    [key: string]: string[];
}
export enum EntityStateEnum {
    /** 正常 */
    ENABLE = 0,
    正常 = ENABLE,
    /** 不可用 */
    DISABLE = 1,
    不可用 = DISABLE,
    /** 废弃 */
    DISCARD = 2,
    废弃 = DISCARD,
    /** 删除 */
    DELETED = -1,
    已删除 = DELETED,
}
