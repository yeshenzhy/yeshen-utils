import { AxiosRequestHeaders, AxiosResponse, AxiosAdapter } from "axios";
import { BackendResultConfig, RequestError } from "../common";
import { injectable } from "inversify";

@injectable()
export class ServiceConfig {
    constructor(config: ServiceConfig) {
        this.baseUrl = config.baseUrl;
        this.handleBackendError = config.handleBackendError;
        this.handleResponseError = config.handleResponseError;
        this.headerInvoke = config.headerInvoke;
        this.adapter = config.adapter;
        this.backendConfig = config.backendConfig;
    }
    /** 基础地址 */
    baseUrl: string;
    /** 使用返回拦截器，默认为true */
    useResponseInterceptor?: boolean;
    /** 后端错误处理 */
    handleBackendError?: (error: RequestError) => void;
    /** 网络错误处理 */
    handleResponseError?: (response: AxiosResponse<any, any>) => void;
    /** 设置header之类的处理 */
    headerInvoke?: (headers?: AxiosRequestHeaders) => void;
    /** 拦截器 */
    adapter?: AxiosAdapter;
    /** 后端配置 */
    backendConfig?: BackendResultConfig;
    /** 数据配置 */
    dataConfig?: Record<string, any>;
}
