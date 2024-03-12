import { BackendResultConfig } from "./Types";
import dayjs from "dayjs";

/** 默认的请求错误 code */
export const DEFAULT_REQUEST_ERROR_CODE = "DEFAULT";

/** 默认的请求错误文本 */
export const DEFAULT_REQUEST_ERROR_MSG = "请求错误~";

/** 请求超时的错误 code(为固定值：ECONNABORTED) */
export const REQUEST_TIMEOUT_CODE = "ECONNABORTED";

/** 请求超时的错误文本 */
export const REQUEST_TIMEOUT_MSG = "请求超时~";

/** 网络不可用的 code */
export const NETWORK_ERROR_CODE = "NETWORK_ERROR";

/** 网络不可用的错误文本 */
export const NETWORK_ERROR_MSG = "网络不可用~";

/** 请求不成功各种状态的错误 */
export const ERROR_STATUS = {
    400: "400: 请求出现语法错误~",
    401: "401: 用户未授权~",
    403: "403: 服务器拒绝访问~",
    404: "404: 请求的资源不存在~",
    405: "405: 请求方法未允许~",
    408: "408: 网络请求超时~",
    500: "500: 服务器内部错误~",
    501: "501: 服务器未实现请求功能~",
    502: "502: 错误网关~",
    503: "503: 服务不可用~",
    504: "504: 网关超时~",
    505: "505: http 版本不支持该请求~",
    [DEFAULT_REQUEST_ERROR_CODE]: DEFAULT_REQUEST_ERROR_MSG,
};

/** 日期格式化 `YYYY-MM-DD` */
export const DATE_FORMAT = "YYYY-MM-DD";
/** 日期格式化 `YYYYMMDD` */
export const DATEFORMAT = "YYYYMMDD";
/** 日期格式化 `YYYYMMDD` */
export const TIMEFORMAT = "YYYYMMDDHHmmss";
/** date fns 的日期格式化 `yyyy-MM-dd` */
export const DATE_FORMAT_FNS = "yyyy-MM-dd";
/** 月份格式化 `YYYYMM` */
export const YEARMONTH_FORMAT = "YYYYMM";
/** 月份格式化 `YYYY-MM` */
export const YEAR_MONTH_FORMAT = "YYYY-MM";
/** 时间格式化 `YYYY-MM-DD HH:mm` */
export const TIME_FORMAT = "YYYY-MM-DD HH:mm";
/** time fns 的时间格式化,不带秒 `yyyy-MM-dd HH:mm`*/
export const TIME_FORMAT_FNS = "yyyy-MM-dd HH:mm";
/** 时间格式化 `YYYY-MM-DD HH:mm:ss` */
export const TIMES_FORMAT = "YYYY-MM-DD HH:mm:ss";
/** time fns 的时间格式化 yyyy-MM-dd HH:mm:ss*/
export const TIMES_FORMAT_FNS = "yyyy-MM-dd HH:mm:ss";
/** 年份格式化 `YYYY`*/
export const YEAR_FORMAT = "YYYY";

/** 日期格式化 */
export function formatDate(date?: string | null | number | Date | dayjs.Dayjs, format: string = DATE_FORMAT) {
    return date ? dayjs(date).format(format) : "";
}
/** 时间格式化 */
export function formatDateTime(
    date?: string | null | number | Date | dayjs.Dayjs,
    format: string = TIME_FORMAT
) {
    return date ? dayjs(date).format(format) : "";
}

/** 后端返回字段设置 */
export const BACKEND_CONFIG: BackendResultConfig = {
    codeKey: "code",
    successCode: 1000,
    dataKey: "data",
    msgKey: "message",
    countKey: "matchedCount",
};
/** 系统默认配置项 */
export const InjectTypes = {
    // 配置项 开放平台专用
    ServiceConfig: Symbol.for("ServiceConfig"),
};
