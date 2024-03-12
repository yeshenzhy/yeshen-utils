import { emitter } from "../event-bus";
import { Nullable, StorageData } from "../common";
import { aes_decode, aes_encode } from "../crypto";

class CustomStorage {
    constructor(storage?: Storage) {
        this.storage = storage;
    }
    storage?: Storage;
    /** 默认缓存期限为14天 */
    DEFAULT_CACHE_TIME = 60 * 60 * 24 * 14;
    clear() {
        this.storage?.clear();
    }
    /** 获取缓存；超过缓存时间的缓存会自动清除，并不会获取到真实数据 */
    get<T>(key: string): Nullable<T> {
        const json = this.storage?.getItem(key as string);
        if (json) {
            let storageData: StorageData<T> | null = null;
            try {
                storageData = aes_decode(json);
            } catch {
                // 防止解析失败
            }
            if (storageData) {
                const { value, expire } = storageData;
                // 在有效期内直接返回
                if (expire === null || expire >= Date.now()) {
                    return value as T;
                }
            }
            this.remove(key);
            return null;
        }
        return null;
    }
    remove(key: string) {
        this.storage?.removeItem(key as string);
    }
    /**  设置缓存；expire：缓存时间，单位秒 */
    set<T>(key: string, value: T, expire: number | null = this.DEFAULT_CACHE_TIME) {
        const storageData: StorageData<T> = {
            value,
            expire: expire !== null ? new Date().getTime() + expire * 1000 : null,
        };
        const json = aes_encode(storageData);
        this.storage?.setItem(key as string, json);
    }
}

if (window?.localStorage) {
    /** 设置 storage，增加拦截 */
    const setItem = window?.localStorage?.setItem;
    window.localStorage.setItem = (key, value) => {
        //订阅一下
        emitter.emit(key, value);
        // Call the original function
        setItem?.call(localStorage, key, value);
    };
}

export const localStg = new CustomStorage(window?.localStorage);

export const sessionStg = new CustomStorage(window?.sessionStorage);
