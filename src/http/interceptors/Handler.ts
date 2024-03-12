import { AxiosError, AxiosResponse } from "axios";
import {
    DEFAULT_REQUEST_ERROR_CODE,
    DEFAULT_REQUEST_ERROR_MSG,
    NETWORK_ERROR_CODE,
    NETWORK_ERROR_MSG,
    REQUEST_TIMEOUT_CODE,
    REQUEST_TIMEOUT_MSG,
    ERROR_STATUS,
    exeStrategyActions,
    StrategyAction,
    RequestError,
    BackendResultConfig,
    RequestResult,
} from "../../common";

import { showErrorMsg } from "../Msg";

type ErrorStatus = keyof typeof ERROR_STATUS;

/** 统一失败和成功的请求结果的数据类型 */
export async function handleServiceResult<T = any>(error: RequestError | null, data: any, total: number = 0) {
    if (error) {
        const fail: RequestResult = {
            error,
            data: null,
            isSuccess: false,
            total,
        };
        return fail;
    }
    const success: RequestResult<T> = {
        error: null,
        data,
        isSuccess: true,
        total,
    };
    return success;
}

/**
 * 处理axios请求失败的错误
 * @param axiosError - 错误
 */
export function handleAxiosError(axiosError: AxiosError) {
    const error: RequestError = {
        type: "axios",
        code: DEFAULT_REQUEST_ERROR_CODE,
        message: DEFAULT_REQUEST_ERROR_MSG,
    };

    const actions: StrategyAction[] = [
        [
            // 网路错误
            !window.navigator.onLine || axiosError.message === "Network Error",
            () => {
                Object.assign(error, {
                    code: NETWORK_ERROR_CODE,
                    msg: NETWORK_ERROR_MSG,
                });
            },
        ],
        [
            // 超时错误
            axiosError.code === REQUEST_TIMEOUT_CODE && axiosError.message.includes("timeout"),
            () => {
                Object.assign(error, {
                    code: REQUEST_TIMEOUT_CODE,
                    msg: REQUEST_TIMEOUT_MSG,
                });
            },
        ],
        [
            // 请求不成功的错误
            Boolean(axiosError.response),
            () => {
                const errorCode: ErrorStatus = (axiosError.response?.status as ErrorStatus) || "DEFAULT";
                const msg = ERROR_STATUS[errorCode];
                Object.assign(error, { code: errorCode, msg });
            },
        ],
    ];

    exeStrategyActions(actions);
    showErrorMsg(error);
    return error;
}
/**
 * 处理后端返回的错误(业务错误)
 * @param backendResult - 后端接口的响应数据
 */
export function handleBackendError(backendResult: Record<string, any>, config: BackendResultConfig) {
    const { codeKey, msgKey } = config;
    const error: RequestError = {
        type: "backend",
        code: backendResult[codeKey],
        message: backendResult[msgKey],
    };
    showErrorMsg(error);
    return error;
}
/**
 * 处理请求成功后的错误
 * @param response - 请求的响应
 */
export function handleResponseError(response: AxiosResponse) {
    const error: RequestError = {
        type: "axios",
        code: DEFAULT_REQUEST_ERROR_CODE,
        message: DEFAULT_REQUEST_ERROR_MSG,
    };

    if (!window.navigator.onLine) {
        // 网路错误
        Object.assign(error, { code: NETWORK_ERROR_CODE, msg: NETWORK_ERROR_MSG });
    } else {
        // 请求成功的状态码非200的错误
        const errorCode: ErrorStatus = response.status as ErrorStatus;
        const msg = ERROR_STATUS[errorCode] || DEFAULT_REQUEST_ERROR_MSG;
        Object.assign(error, { type: "http", code: errorCode, msg });
    }
    showErrorMsg(error);

    return error;
}
