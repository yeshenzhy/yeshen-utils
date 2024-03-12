import { merge, isEqual } from "lodash-es";
import numeral from "numeral";
import { helpers, JsonSchema, JsonSchemaItem, SchemaOptions } from "./Helper";

const defaultOptions: SchemaOptions = {
    required: false,
    postProcessFnc: null,

    strings: {
        detectFormat: true,
        preProcessFnc: null,
    },
    arrays: {
        mode: "all",
    },
    objects: {
        preProcessFnc: null,
        postProcessFnc: null,
        additionalProperties: true,
    },
};

const skipReverseFind = ["hostname", "host-name", "alpha", "alphanumeric", "regex", "regexp", "pattern"];
const filteredFormats = helpers.stringFormats.filter((item) => skipReverseFind.indexOf(item) < 0);

function getCommonTypeFromArrayOfTypes(arrOfTypes) {
    let lastVal;
    for (let i = 0, { length } = arrOfTypes; i < length; i++) {
        let currentType = arrOfTypes[i];
        if (i > 0) {
            if (currentType === "integer" && lastVal === "number") {
                currentType = "number";
            } else if (currentType === "number" && lastVal === "integer") {
                lastVal = "number";
            }
            if (lastVal !== currentType) return null;
        }
        lastVal = currentType;
    }
    return lastVal;
}

function getCommonArrayItemsType(arr) {
    return getCommonTypeFromArrayOfTypes(arr.map((item) => helpers.getType(item)));
}

export class ToJsonSchema {
    constructor(options: SchemaOptions) {
        this.options = merge({}, defaultOptions, options);

        this.getObjectSchemaDefault = this.getObjectSchemaDefault.bind(this);
        this.getStringSchemaDefault = this.getStringSchemaDefault.bind(this);
        this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
        this.commonPostProcessDefault = this.commonPostProcessDefault.bind(this);
        this.objectPostProcessDefault = this.objectPostProcessDefault.bind(this);
    }
    options: SchemaOptions;
    /**
     * Tries to find the least common schema that would validate all items in the array. More details
     * helpers.mergeSchemaObjs description
     * @param {array} arr
     * @returns {object|null}
     */
    getCommonArrayItemSchema(arr) {
        const schemas = arr.map((item) => this.getSchema(item));
        // schemas.forEach(schema => console.log(JSON.stringify(schema, '\t')))
        return schemas.reduce((acc, current) => helpers.mergeSchemaObjs(acc, current), schemas.pop());
    }

    getObjectSchemaDefault(obj) {
        const schema: JsonSchema = { type: "object" };
        const objKeys = Object.keys(obj);
        if (objKeys.length > 0) {
            schema["properties"] = objKeys.reduce((acc, propertyName) => {
                acc[propertyName] = this.getSchema(obj[propertyName]); // eslint-disable-line no-param-reassign
                return acc;
            }, {});
        }
        return schema;
    }

    getObjectSchema(obj) {
        if (this.options.objects.preProcessFnc) {
            return this.options.objects.preProcessFnc(obj, this.getObjectSchemaDefault);
        }
        return this.getObjectSchemaDefault(obj);
    }

    getArraySchemaMerging(arr) {
        const schema: JsonSchema = { type: "array" };
        const commonType = getCommonArrayItemsType(arr);
        if (commonType) {
            schema["items"] = { type: commonType };
            if (commonType !== "integer" && commonType !== "number") {
                const itemSchema = this.getCommonArrayItemSchema(arr);
                if (itemSchema) {
                    schema["items"] = itemSchema;
                }
            } else if (this.options.required) {
                // schema.items.required = true;
            }
        }
        return schema;
    }

    getArraySchemaNoMerging(arr) {
        const schema: JsonSchema = { type: "array" };
        if (arr.length > 0) {
            schema["items"] = this.getSchema(arr[0]);
        }
        return schema;
    }

    getArraySchemaTuple(arr) {
        const schema: JsonSchema = { type: "array" };
        if (arr.length > 0) {
            schema["items"] = arr.map((item) => this.getSchema(item));
        }
        return schema;
    }

    getArraySchemaUniform(arr) {
        const schema = this.getArraySchemaNoMerging(arr);

        if (arr.length > 1) {
            for (let i = 1; i < arr.length; i++) {
                if (!isEqual(schema["items"], this.getSchema(arr[i]))) {
                    throw new Error("Invalid schema, incompatible array items");
                }
            }
        }
        return schema;
    }

    getArraySchema(arr) {
        if (arr.length === 0) {
            return { type: "array" };
        }
        switch (this.options.arrays.mode) {
            case "all":
                return this.getArraySchemaMerging(arr);
            case "first":
                return this.getArraySchemaNoMerging(arr);
            case "uniform":
                return this.getArraySchemaUniform(arr);
            case "tuple":
                return this.getArraySchemaTuple(arr);
            default:
                throw new Error(`Unknown array mode option '${this.options.arrays.mode}'`);
        }
    }

    getStringSchemaDefault(value) {
        const schema: JsonSchema = { type: "string" };

        if (!this.options.strings.detectFormat) {
            return schema;
        }

        const index = filteredFormats.findIndex((item) => helpers.isFormat(value, item));
        if (index >= 0) {
            schema["format"] = filteredFormats[index];
        }

        return schema;
    }

    getStringSchema(value) {
        if (this.options.strings.preProcessFnc) {
            return this.options.strings.preProcessFnc(value, this.getStringSchemaDefault);
        }
        return this.getStringSchemaDefault(value);
    }

    commonPostProcessDefault(_type, schema, _value) {
        // eslint-disable-line no-unused-vars
        if (this.options.required) {
            return merge({}, schema, { required: true });
        }
        return schema;
    }

    objectPostProcessDefault(schema, obj) {
        if (
            this.options.objects.additionalProperties === false &&
            Object.getOwnPropertyNames(obj).length > 0
        ) {
            return merge({}, schema, { additionalProperties: false });
        }
        return schema;
    }

    /**
     * Gets JSON schema for provided value
     * @param value
     * @returns {object}
     */
    getSchema(value) {
        const type = helpers.getType(value);
        if (!type) {
            throw new Error("Type of value couldn't be determined");
        }

        let schema: JsonSchema;
        switch (type) {
            case "object":
                schema = this.getObjectSchema(value);
                break;
            case "array":
                schema = this.getArraySchema(value);
                break;
            case "string":
                schema = this.getStringSchema(value);
                break;
            default:
                schema = { type };
        }

        if (this.options.postProcessFnc) {
            schema = this.options.postProcessFnc(type, schema, value, this.commonPostProcessDefault);
        } else {
            schema = this.commonPostProcessDefault(type, schema, value);
        }

        if (type === "object") {
            if (this.options.objects.postProcessFnc) {
                schema = this.options.objects.postProcessFnc(schema, value, this.objectPostProcessDefault);
            } else {
                schema = this.objectPostProcessDefault(schema, value);
            }
        }

        return schema;
    }
    /** 将结构转为list */
    getSchemaList(value: JsonSchema, key: string, rootName: string = key) {
        const schemaList: JsonSchemaItem[] = [];

        const jsonItem = new JsonSchemaItem(
            key || "root",
            value.title || value.description || rootName,
            value.type,
            value.description,
            value["value"]
        );
        switch (value.type) {
            case "object":
                if (value.properties) {
                    Object.keys(value.properties).map((it) => {
                        if (value.properties) {
                            jsonItem.children.push(...this.getSchemaList(value.properties[it], it));
                        }
                    });
                }
                schemaList.push(jsonItem);
                break;
            case "array":
                if (value.items) {
                    jsonItem.children.push(...this.getSchemaList(value.items, "items"));
                    schemaList.push(jsonItem);
                }
                break;
            default:
                schemaList.push(jsonItem);
                break;
        }
        return schemaList;
    }
    getDefineList(list: JsonSchemaItem[], parentKey?: string) {
        const defines: any = [];
        list.map((value) => {
            const defineItem = { ...value };
            switch (defineItem.type) {
                case "object":
                    defineItem.type = "OBJECT";
                    defineItem.children = this.getDefineList(defineItem.children);
                    break;
                case "array":
                    if (defineItem.children[0].type === "object") {
                        defineItem.type = "COLLECTION_OBJECTS";
                        defineItem.children = this.getDefineList(defineItem.children[0].children)
                    } else {
                        defineItem.type = "COLLECTION_PRIMITIVES_TEXT";
                        defineItem.children = this.getDefineList(defineItem.children);
                    }
                    break;
                default:
                    defineItem.type = "PRIMITIVE_TEXT";
                    defineItem.name = defineItem.title;
                    defineItem.parentKey = parentKey ?? "";
                    break;
                }
                defineItem.input = { require: defineItem.required ?? true };
                defineItem.output = { require: defineItem.required ?? true };
                defines.push(defineItem);
        });
        return defines;
    }

    /** 获取JSON值 */
    getJsonValue(value: JsonSchemaItem[]) {
        const jsonValue: any = {};
        value.map((it) => {
            switch (it.type) {
                case "array":
                    jsonValue[it.key] = [];
                    if (it.children[0].type === "object") {
                        jsonValue[it.key].push(this.getJsonValue(it.children[0].children as any));
                    }
                    break;
                case "object":
                    jsonValue[it.key] = this.getJsonValue(it.children);
                    break;
                case "number":
                case "integer":
                    jsonValue[it.key] = numeral(it.value).value();
                    break;
                default:
                    jsonValue[it.key] = it.value;
                    break;
            }
        });
        return jsonValue;
    }
    getJsonSchema(value: JsonSchemaItem[]) {
        const schema: JsonSchema = {};
        value.map((it) => {
            switch (it.type) {
                case "array":
                    schema[it.key] = this.getJsonSchema(it.children);
                    schema[it.key].type = it.type;
                    schema[it.key].title = it.title;
                    schema[it.key].description = it.description;
                    schema[it.key].value = it.value;
                    break;
                case "object":
                    schema[it.key] = { type: it.type };
                    schema[it.key].properties = this.getJsonSchema(it.children) as any;
                    it.title && (schema[it.key].title = it.title);
                    schema[it.key].description = it.description;
                    schema[it.key].value = it.value;
                    break;
                default:
                    schema[it.key] = { type: it.type, value: it.value };
                    it.title && (schema[it.key].title = it.title);
                    schema[it.key].description = it.description;
                    schema[it.key].value = it.value;
                    break;
            }
        });
        return schema;
    }
}
/** 转换为JsonSchema */
export function toJsonSchema(value, options) {
    const tjs = new ToJsonSchema(options);
    return tjs.getSchema(value);
}

/** JsonSchema转List */
export function jsonSchema2List(value, options, rootName = "root") {
    const tjs = new ToJsonSchema(options);
    return tjs.getSchemaList(value, "root", rootName);
}
/** 将JsonSchema转换为数据契约定义,去掉root节点 */
export function list2DefineList(value: JsonSchemaItem[], options) {
    const tjs = new ToJsonSchema(options);
    return tjs.getDefineList(value);
}
/** List转JsonSchema 有损转换，只保留了结构和类型 */
export function list2JsonSchema(value: JsonSchemaItem[], options) {
    const tjs = new ToJsonSchema(options);
    const schema: JsonSchema = {
        type: value[0].type,
        title: value[0].title,
        description: value[0].description,
    };
    schema.properties = tjs.getJsonSchema(value[0].children) as any;
    return schema;
}
/** 转换为默认值 */
export function toJsonPlain(value: JsonSchemaItem[], options) {
    const tjs = new ToJsonSchema(options);
    const withRootValue = tjs.getJsonValue(value);
    return Object.values(withRootValue)[0];
}
