import { AxiosInstance, AxiosRequestConfig } from "axios";
import { CustomAxiosInstance } from "./Instance";
import ObjectHash from "object-hash";
import { HandleThrottleResponse } from "./interceptors";
import { RequestMethod, RequestOptions, RequestParam, RequestResult, UploadFileParams } from "../common";
/**
 * 创建请求
 * @param axiosConfig - axios配置
 * @param backendConfig - 后端接口字段配置
 */
export class RequestService {
    customInstance: CustomAxiosInstance;

    constructor(axiosConfig: AxiosRequestConfig, options?: RequestOptions) {
        this.customInstance = new CustomAxiosInstance(axiosConfig, options);
    }

    getRequestResponse(params: {
        instance: AxiosInstance;
        method: RequestMethod;
        url: string;
        data?: any;
        config?: AxiosRequestConfig;
    }) {
        const { instance, method, url, data, config } = params;
        let res: any; //= await instance.request({ url, data, method, ...config });
        if (method === "get" || method === "delete") {
            res = instance[method](url, config);
        } else {
            res = instance[method](url, data, config);
        }
        return res;
    }

    /**
     * 异步promise请求
     * @param param - 请求参数
     * - url: 请求地址
     * - method: 请求方法(默认get)
     * - data: 请求的body的data
     * - axiosConfig: axios配置
     */
    async asyncRequest<T>(param: RequestParam): Promise<RequestResult<T>> {
        const { url } = param;
        const method = param.method || "get";
        const { instance } = this.customInstance;
        const action = () =>
            this.getRequestResponse({
                instance,
                method,
                url,
                data: param.data,
                config: param.axiosConfig,
            });
        /** 节流处理 */
        if (this.customInstance.options.throttle && !(param.data instanceof FormData)) {
            const hash = ObjectHash({ _sendUrl: url, data: param.data, param: param.axiosConfig?.params });
            return await HandleThrottleResponse(hash, action);
        } else {
            return await action();
        }
    }

    /**
     * get请求
     * @param url - 请求地址
     * @param config - axios配置
     */
    get<T>(url: string, config?: AxiosRequestConfig) {
        return this.asyncRequest<T>({ url, method: "get", axiosConfig: config });
    }

    /**
     * post请求
     * @param url - 请求地址
     * @param data - 请求的body的data
     * @param config - axios配置
     */
    post<T>(url: string, data: any = {}, config?: AxiosRequestConfig) {
        return this.asyncRequest<T>({
            url,
            method: "post",
            data,
            axiosConfig: config,
        });
    }
    /**
     * put请求
     * @param url - 请求地址
     * @param data - 请求的body的data
     * @param config - axios配置
     */
    put<T>(url: string, data: any = {}, config?: AxiosRequestConfig) {
        return this.asyncRequest<T>({
            url,
            method: "put",
            data,
            axiosConfig: config,
        });
    }

    /**
     * delete请求
     * @param url - 请求地址
     * @param config - axios配置
     */
    delete<T>(url: string, config: AxiosRequestConfig) {
        return this.asyncRequest<T>({ url, method: "delete", axiosConfig: config });
    }
    /**
     * 上传
     * @param url - 请求地址
     * @param config - axios配置
     */
    uploadFile<T = any>(url: string, params: UploadFileParams, config: AxiosRequestConfig) {
        const formData = new window.FormData();
        const customFilename = params.name || "file";
        if (params.filename) {
            formData.append(customFilename, params.file, params.filename);
        } else {
            formData.append(customFilename, params.file);
        }

        if (params.data) {
            Object.keys(params.data).forEach((key) => {
                const value = params.data![key];
                if (Array.isArray(value)) {
                    value.forEach((item) => {
                        formData.append(`${key}[]`, item);
                    });
                    return;
                }

                formData.append(key, params.data![key]);
            });
        }
        if (!config) config = {};
        if (!config.headers) config.headers = {};

        return this.asyncRequest<T>({
            url: url,
            method: "post",
            data: formData,
            axiosConfig: config,
        });
    }
}
