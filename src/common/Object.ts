import { isObjectLike } from "lodash-es";
import { isArray, isObject } from "./Is";
/** 递归设置对象所有值为null */
export function resetObject(model: Object, defaultValue = {}) {
    for (const key in model) {
        if (isObjectLike(model[key])) {
            resetObject(model[key]);
        } else if (isArray(model[key])) {
            model[key] = [];
        } else {
            if (!!defaultValue[key]) {
                model[key] = defaultValue[key];
            } else {
                model[key] = null;
            }
        }
    }
}
/** 生成UUID */
export function uuid() {
    let d = Date.now();
    if (typeof performance !== "undefined" && typeof performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
}
/** 随机字符串 */
export const randomString = (length: number, ranStr = "") => {
    const chars = ranStr || "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let result = "";
    for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
};
/** 将整个类对象转换为plain对象 */
export function classToPlainWithGet(obj: any) {
    const proto = Object.getPrototypeOf(obj);
    const jsonObj: any = Object.assign({}, obj);

    Object.entries(Object.getOwnPropertyDescriptors(proto))
        .filter(([_key, descriptor]) => typeof descriptor.get === "function")
        .map(([key, descriptor]) => {
            if (descriptor && key[0] !== "_") {
                try {
                    const val = (obj as any)[key];
                    if (isObject(val)) {
                        jsonObj[key] = classToPlainWithGet(val);
                    } else {
                        jsonObj[key] = val;
                    }
                } catch (error) {}
            }
        });

    return jsonObj;
}
