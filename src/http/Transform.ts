import { defaultsDeep } from "lodash-es";
import { EnumContentType, classToPlainWithGet } from "../common/";
import qs from "qs";
import { isObject } from "../common";
import { instanceToPlain } from "class-transformer";

/**
 * 请求数据的转换
 * @param requestData - 请求数据
 * @param contentType - 请求头的Content-Type
 */
export async function transformRequestData(requestData: any, contentType?: string) {
    // application/json类型不处理
    let data = requestData;

    // form类型转换
    if (contentType === EnumContentType.formUrlencoded) {
        data = qs.stringify(requestData);
    }
    //无论如何，都要对数据进行处理
    if (isObject(data)) {
        data = classToPlainWithGet(data);
    }
    // 特别处理一下，转为普通字面对象
    // data = instanceToPlain(data);
    return data;
}
/**
 * @param {string} baseUrl - 请求url
 * @param {any} obj        -  get请求params
 */
export function setObjToUrlParams(baseUrl: string, obj: any): string {
    if (!obj) {
        return baseUrl;
    }
    let parameters = "";
    for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined) {
            parameters += key + "=" + encodeURIComponent(obj[key]) + "&";
        }
    }
    parameters = parameters.replace(/&$/, "");
    return /\?$/.test(baseUrl)
        ? baseUrl + parameters
        : baseUrl.replace(/\/?$/, /\?/.test(baseUrl) ? "&" : "?") + parameters;
}
/**
 * 请求数据的转换
 * @param requestData - 请求数据
 * @param contentType - 请求头的Content-Type
 */
export function transformRequestUrl(url: string, params?: Record<string, any>) {
    return setObjToUrlParams(url as string, params);
}
