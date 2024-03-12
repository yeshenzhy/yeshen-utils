/** 分页结构 */
export class PaginateStatement {
    constructor(page: number, pageSize: number) {
        this.page = page - 1 < 0 ? 0 : page - 1;
        this.pageSize = pageSize;
    }
    /** 当前页 */
    page: number;
    /** 每页显示 */
    pageSize: number;
}
