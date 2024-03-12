import { AxiosAdapter, AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from "axios";

/** 请求的相关类型 */
export type RequestMethod = "get" | "post" | "put" | "delete";

export interface RequestParam {
    url: string;
    method?: RequestMethod;
    data?: any;
    axiosConfig?: AxiosRequestConfig;
}
/**
 * 请求的错误类型：
 * - axios: axios错误：网络错误, 请求超时, 默认的兜底错误
 * - http: 请求成功，响应的http状态码非200的错误
 * - backend: 请求成功，响应的http状态码为200，由后端定义的业务错误
 */
export type RequestErrorType = "axios" | "http" | "backend";

/** 请求错误 */
export interface RequestError {
    /** 请求服务的错误类型 */
    type: RequestErrorType;
    /** 错误码 */
    code: string | number;
    /** 错误信息 */
    message: string;
}

declare type Recordable<T = any> = Record<string, T>;
export interface UploadFileParams {
    // 其他数据
    data?: Recordable;
    // File parameter interface field name
    name?: string;
    // 文件
    file: File | Blob;
    // 文件名
    filename?: string;
    [key: string]: any;
}

/** 后端接口返回的数据结构配置 */
export interface BackendResultConfig {
    /** 表示后端请求状态码的属性字段 */
    codeKey: string;
    /** 表示后端请求数据的属性字段 */
    dataKey: string;
    /** 表示后端消息的属性字段 */
    msgKey: string;
    /** 后端业务上定义的成功请求的状态 */
    successCode: any;
    /** 后端匹配数据的数量 */
    countKey: string;
}
export interface RequestOptions {
    //启用节流
    throttle?: boolean;
    /** 超时时间 */
    timeout?: number;
    /**　后台返回数据Parse处理 */
    backendConfig?: BackendResultConfig;
    /** 使用返回拦截器，默认为true */
    useResponseInterceptor?: boolean;
    /** 拦截后端错误，在使用返回拦截器时可用 */
    handleBackendError?: (error: RequestError) => void;
    /** 拦截返回错误，在使用返回拦截器时可用 */
    handleResponseError?: (response: AxiosResponse<any, any>) => void;
    /** Header处理 */
    headerInvoke?: (headers?: AxiosRequestHeaders) => void;
    /** 适配器 */
    adapter?: AxiosAdapter;
}

/** 自定义的请求成功结果 */
export type RequestResult<T = any> =
    | {
          /** 请求错误 */
          error: null;
          /** 请求数据 */
          data: T;
          /** 后端对请求进行匹配的数量；两种情况下的处理1.查询总行数；2.修改、删除、添加行数 */
          total: number;
          /** 是否成功 */
          isSuccess: true;
      }
    | {
          /** 请求错误 */
          error: RequestError;
          /** 请求数据 */
          data: null;
          /** 后端对请求进行匹配的数量；两种情况下的处理1.查询总行数；2.修改、删除、添加行数 */
          total: number;
          /** 是否成功 */
          isSuccess: false;
      };

/** 自定义的请求结果 */
// export type RequestResult<T = any> = SuccessResult<T>;

/** 多个请求数据结果 */
export type MultiRequestResult<T extends any[]> = T extends [infer First, ...infer Rest]
    ? [First] extends [any]
        ? Rest extends any[]
            ? [RequestResult<First>, ...MultiRequestResult<Rest>]
            : [RequestResult<First>]
        : Rest extends any[]
        ? MultiRequestResult<Rest>
        : []
    : [];

/** 请求结果的适配器函数 */
export type ServiceAdapter<T = any, A extends any[] = any> = (...args: A) => T;

export interface StorageData<T> {
    value: T;
    expire: number | null;
}

export type BasicArray = Array<string | number | boolean>;
export type BasicType = number | string | boolean | object | BasicArray;

export type Nullable<T> = T | null;
/** 转换为 原始对象，移除null/undefined的对象 */
export type OriginalType<T extends BasicType | null | undefined> = T extends null | undefined ? never : T;

export type StrategyAction = [boolean, () => void];
/** 基础选项 */
export interface OptionBase<V extends BasicType, L extends string> {
    value?: V;
    label?: L;
    parentValue?: V;
}
