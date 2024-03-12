import CryptoJS from "crypto-js";

const CRYPTO_SECRET = "__DongRun_Secret__";

/**
 * 加密数据
 */
export function aes_encode(data: any, secretKey?: string, cfg?: any) {
    const newData = JSON.stringify(data);
    return CryptoJS.AES.encrypt(
        newData,
        secretKey || CRYPTO_SECRET,
        cfg || { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    ).toString();
}

/**
 * 解密数据
 */
export function aes_decode(cipherText: string, secretKey?: string, cfg?: any) {
    const bytes = CryptoJS.AES.decrypt(
        cipherText,
        secretKey || CRYPTO_SECRET,
        cfg || { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    );
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (originalText) {
        return JSON.parse(originalText);
    }
    return null;
}

//base64加密
export function base64_encode(code: string, key: string, config?: any) {
    return CryptoJS.AES.encrypt(
        code,
        CryptoJS.enc.Base64.parse(key),
        config || {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        }
    ).toString();
}
//base64解密
export function base64_decode(code: string, key: string, config?: any) {
    return CryptoJS.AES.decrypt(
        code,
        CryptoJS.enc.Base64.parse(key),
        config || {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        }
    ).toString(CryptoJS.enc.Utf8);
}
/** 加解密对象 */
export const cryptoIns = {
    aes_encode,
    aes_decode,
    base64_encode,
    base64_decode,
    CryptoJS,
};
