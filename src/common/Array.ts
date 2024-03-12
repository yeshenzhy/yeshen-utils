/** 将List转换为tree */
export function list2Tree(array: any[], id: string | null = null, idKey = "id", parentIdKey = "parentId") {
    const res = array
        .filter((item) => item[parentIdKey] == id || (id == null && !item[parentIdKey]))
        .map((item) => {
            const children = list2Tree(array, item[idKey], idKey, parentIdKey);
            if (children.length > 0) {
                item.children = children;
            }
            return item;
        });
    return res;
}

/** 对象数组去重 */
export function uniqueKey(arr, key) {
    const obj = {};
    arr.reduce((prev, curr) => {
        obj[curr[key]] ? "" : (obj[curr[key]] = true && prev.push(curr));
        return curr;
    }, []);
}