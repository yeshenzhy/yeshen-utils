import axios from "axios";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import {
    handleAxiosError,
    handleBackendError,
    handleResponseError,
    handleServiceResult,
} from "./interceptors";
import { transformRequestData, transformRequestUrl } from "./Transform";
import { BACKEND_CONFIG, RequestOptions } from "../common";
import { defaultsDeep } from "lodash-es";

/**
 * 封装axios请求类
 */
export class CustomAxiosInstance {
    instance: AxiosInstance;

    options: RequestOptions;

    /**
     *
     * @param axiosConfig - axios配置
     * @param options -
     */
    constructor(axiosConfig: AxiosRequestConfig, options?: RequestOptions) {
        this.options = defaultsDeep({}, options, {
            backendConfig: BACKEND_CONFIG,
            useResponseInterceptor: true,
        });
        axios.defaults.timeout = this.options?.timeout;
        /** 增加适配器，为了匹配uni-app的uni-request */
        this.instance = axios.create(axiosConfig);
        this.options?.adapter && (this.instance.defaults.adapter = this.options.adapter);
        this.setInterceptor();
    }

    /** 设置请求拦截器 */
    setInterceptor() {
        this.instance.interceptors.request.use(
            async (config) => {
                const handleConfig = { ...config };
                // 数据转换
                const contentType = handleConfig.headers?.["Content-Type"] as string;
                //处理数据，其实可以不处理
                handleConfig.data = await transformRequestData(handleConfig.data, contentType);
                /** 执行header */
                this.options?.headerInvoke?.(handleConfig.headers);
                //处理Url中的Params
                handleConfig.url = transformRequestUrl(config.url!, config.params);
                handleConfig.params = undefined;
                handleConfig.baseURL = handleConfig.url.startsWith("http") ? "" : handleConfig.baseURL;
                // 由使用方处理config
                return handleConfig;
            },
            (axiosError: AxiosError) => {
                const error = handleAxiosError(axiosError);
                return handleServiceResult(error, null);
            }
        );

        this.options.useResponseInterceptor &&
            this.instance.interceptors.response.use(
                async (response) => {
                    const { status } = response;
                    if (status === 200 || status < 300 || status === 304) {
                        const backend = response.data;
                        const { codeKey, dataKey, successCode, countKey } = this.options.backendConfig!;
                        // 请求成功
                        if (backend[codeKey] === successCode) {
                            return handleServiceResult(null, backend[dataKey], backend[countKey]);
                        }

                        const error = handleBackendError(backend, this.options.backendConfig!);
                        this.options.handleBackendError?.(error);
                        return handleServiceResult(error, null);
                    }
                    const error = handleResponseError(response);
                    this.options.handleResponseError?.(response);

                    return handleServiceResult(error, null);
                },
                (axiosError: AxiosError) => {
                    const error = handleAxiosError(axiosError);
                    this.options.handleBackendError?.(error);
                    return handleServiceResult(error, null);
                }
            );
    }
}
