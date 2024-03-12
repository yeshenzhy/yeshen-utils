import dayjs from "dayjs";
import { Nullable, TIME_FORMAT } from "../common";
import { EntityStateEnum } from ".";

export abstract class BasicJpaEntity {
    /** 初始化函数，继承此类必须重写此函数 */
    abstract init(): void;
    /** ID  */
    id?: Nullable<string> = null;
    /**
     * 最后一次操作方式
     */
    method?: Nullable<string> = null;
    /**
     * 数据契约id。
     */
    dataContractId?: Nullable<string> = null;
    /**
     * 数据契约版本号
     */
    dataContractVersion?: Nullable<string> = null;
    /**
     * 平台领域
     * 单字母，一般服务端配置，设置时手动写入
     * 必须
     */
    platformDomainId?: Nullable<string> = null;
    /**
     * 组织域
     * 必须
     */
    orgDomainIds?: Nullable<string> = null;
    /** 业务域 */
    bizDomainIds?: Nullable<string> = null;
    /**
     * 归属域
     * 可见性标签默认
     */
    ascriptionDomain?: Nullable<string> = null;
    /**
     * 数据授权（身份）
     * 身份集合
     * 此临时授权 高于 可见性
     * <p>
     * 角色、身份实体无此逻辑
     */
    accredit?: Nullable<string> = null;
    /**
     * 创建时间。毫秒
     */
    createTime?: number;
    /** 创建时间时间 */
    get createTimeStr() {
        return dayjs(this.createTime).format(TIME_FORMAT);
    }
    /**
     * 创造者身份。
     */
    creatorIdentity?: Nullable<string> = null;
    /**
     * 创建者代理人
     */
    creatorProxy?: Nullable<string> = null;
    /** 创建人名称 */
    creatorName?: Nullable<string> = null;
    /**
     * 更新时间。毫秒
     */
    updateTime?: number;
    /** 更新时间 */
    get updateTimeStr() {
        return dayjs(this.updateTime).format(TIME_FORMAT);
    }
    /**
     * 修改者身份
     */
    menderIdentity?: Nullable<string> = null;
    /**
     * 修改代理人
     * 运营者账号ID
     */
    menderProxy?: Nullable<string> = null;
    /** 修改者名称 */
    menderName?: Nullable<string> = null;
    /**
     * 状态.
     */
    state: EntityStateEnum = EntityStateEnum.ENABLE;
    /**
     * 自定义标签
     */
    customTags?: Nullable<string> = null;
    /**
     * 版本号
     */
    version?: number;
    /**
     * 排序（序号）
     */
    orderIndex?: number;
}
