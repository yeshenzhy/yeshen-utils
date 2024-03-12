import { QuerySortableEnum } from "./Enum";

/** 排序结构 */
export class SortableStatement {
    constructor(symbol: QuerySortableEnum, fieldName: string) {
        this.symbol = symbol;
        this.fieldName = fieldName;
    }
    /** 排序顺序 */
    symbol: QuerySortableEnum;
    /** 参数名 */
    fieldName: string;
}
