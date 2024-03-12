/** 基础事件 */
export interface IBaseModel {
    /** 根据Id进行保存（适用添加、修改、删除） */
    save(): Promise<boolean>;
    /** 根据ID删除（其实是修改state） */
    deleteById(): Promise<boolean>;
}
