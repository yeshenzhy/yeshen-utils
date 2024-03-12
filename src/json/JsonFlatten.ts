
function isBuffer(obj) {
    return (
        obj &&
        obj.constructor &&
        typeof obj.constructor.isBuffer === "function" &&
        obj.constructor.isBuffer(obj)
    );
}

function keyIdentity(key) {
    return key;
}
export function flatten(target, opts?) {
    opts = opts || {};

    const delimiter = opts.delimiter || ".";
    const maxDepth = opts.maxDepth;
    const transformKey = opts.transformKey || keyIdentity;
    const output = {};

    function step(object, prev?, currentDepth?) {
        currentDepth = currentDepth || 1;
        Object.keys(object).forEach(function (key) {
            const value = object[key];
            const isarray = opts.safe && Array.isArray(value);
            const type = Object.prototype.toString.call(value);
            const isbuffer = isBuffer(value);
            const isobject = type === "[object Object]" || type === "[object Array]";

            const newKey = prev ? prev + delimiter + transformKey(key) : transformKey(key);

            if (
                !isarray &&
                !isbuffer &&
                isobject &&
                Object.keys(value).length &&
                (!opts.maxDepth || currentDepth < maxDepth)
            ) {
                return step(value, newKey, currentDepth + 1);
            }

            output[newKey] = value;
        });
    }

    step(target);

    return output;
}

export function reg(str) {
    console.log(str.match(/([^.]+)$/)[0])
}
/**
 *
 * @param target 目标对象
 * @param originKey 需要替换的字段，完整路径
 * @param outputKey 扁平后的字段，与需要替换的字段需要一致
 * @param primary 优先级，当子层级中字段名一致时，优先保存这个参数里的值，完整路径
 * @returns 扁平后的对象
 */
export function obj2Flatten(target: object, originKey: string[] = [], outputKey: string[] = [], primary: string[] = []) {
    const output = {}

    function step(object, prev?, specFild?) {
        Object.keys(object).forEach(function (key) {
            const value = object[key];
            const isarray = Array.isArray(value);
            const type = Object.prototype.toString.call(value);
            const isbuffer = isBuffer(value);
            const isobject = type === "[object Object]" || type === "[object Array]";

            const current = prev ? prev + '.' + key : key;
            const newKey = specFild ? key + specFild : originKey?.indexOf(current) !== -1 ? outputKey?.[originKey?.indexOf(current)!] : key
            if (
                !isarray &&
                !isbuffer &&
                isobject &&
                Object.keys(value).length
            ) {
                switch (current) {
                    case 'bus_sal_bargainor':
                        return step(value, prev ? prev + '.' + key : key, '_Bargainor');
                    case 'bus_cus_customer_group':
                        return step(value, prev ? prev + '.' + key : key, '_Customer');
                    case 'bus_cus_customer':
                        return step(value, prev ? prev + '.' + key : key, '_Customer');
                    default:
                        return step(value, prev ? prev + '.' + key : key);
                }
            }

            const primaryKey = primary?.find(item => (item.match(/([^.]+)$/) as string[])[0] === key)
            if (primaryKey && current !== primaryKey && !specFild) { return }
            else {
                output[newKey!] = value;
            }
        });
    }

    step(target);

    return output;
}

export function unflatten(target, opts) {
    opts = opts || {};

    const delimiter = opts.delimiter || ".";
    const overwrite = opts.overwrite || false;
    const transformKey = opts.transformKey || keyIdentity;
    const result = {};

    const isbuffer = isBuffer(target);
    if (isbuffer || Object.prototype.toString.call(target) !== "[object Object]") {
        return target;
    }

    // safely ensure that the key is
    // an integer.
    function getkey(key) {
        const parsedKey = Number(key);

        return isNaN(parsedKey) || key.indexOf(".") !== -1 || opts.object ? key : parsedKey;
    }

    function addKeys(keyPrefix, recipient, target) {
        return Object.keys(target).reduce(function (result, key) {
            result[keyPrefix + delimiter + key] = target[key];

            return result;
        }, recipient);
    }

    function isEmpty(val) {
        const type = Object.prototype.toString.call(val);
        const isArray = type === "[object Array]";
        const isObject = type === "[object Object]";

        if (!val) {
            return true;
        } else if (isArray) {
            return !val.length;
        } else if (isObject) {
            return !Object.keys(val).length;
        }
    }

    target = Object.keys(target).reduce(function (result, key) {
        const type = Object.prototype.toString.call(target[key]);
        const isObject = type === "[object Object]" || type === "[object Array]";
        if (!isObject || isEmpty(target[key])) {
            result[key] = target[key];
            return result;
        } else {
            return addKeys(key, result, flatten(target[key], opts));
        }
    }, {});

    Object.keys(target).forEach(function (key) {
        const split = key.split(delimiter).map(transformKey);
        let key1 = getkey(split.shift());
        let key2 = getkey(split[0]);
        let recipient = result;

        while (key2 !== undefined) {
            if (key1 === "__proto__") {
                return;
            }

            const type = Object.prototype.toString.call(recipient[key1]);
            const isobject = type === "[object Object]" || type === "[object Array]";

            // do not write over falsey, non-undefined values if overwrite is false
            if (!overwrite && !isobject && typeof recipient[key1] !== "undefined") {
                return;
            }

            if ((overwrite && !isobject) || (!overwrite && recipient[key1] == null)) {
                recipient[key1] = typeof key2 === "number" && !opts.object ? [] : {};
            }

            recipient = recipient[key1];
            if (split.length > 0) {
                key1 = getkey(split.shift());
                key2 = getkey(split[0]);
            }
        }

        // unflatten again for 'messy objects'
        recipient[key1] = unflatten(target[key], opts);
    });

    return result;
}
