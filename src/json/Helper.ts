import { types, FORMAT_REGEXPS, isFormat } from "./JsonSchemaHelpers";
import { xor, isEqual, keys } from "lodash-es";
export const helpers = {
    stringFormats: keys(FORMAT_REGEXPS),

    isFormat,

    typeNames: [
        "integer",
        "number", // make sure number is after integer (for proper type detection)
        "string",
        "array",
        "object",
        "boolean",
        "null",
        "date",
    ],

    getType(val) {
        return helpers.typeNames.find((typeName) => types[typeName](val));
    },

    /**
     * Tries to find the least common schema from two supplied JSON schemas. If it is unable to find
     * such a schema, it returns null. Incompatibility in structure/types leads to returning null,
     * except when the difference is only integer/number. Than the 'number' is used instead 'int'.
     * Types/Structure incompatibility in array items only leads to schema that doesn't specify
     * items structure/type.
     * @param {object} schema1 - JSON schema
     * @param {object} schema2 - JSON schema
     * @returns {object|null}
     */
    mergeSchemaObjs(schema1, schema2) {
        const schema1Keys = keys(schema1);
        const schema2Keys = keys(schema2);
        if (!isEqual(schema1Keys, schema2Keys)) {
            if (schema1.type === "array" && schema2.type === "array") {
                if (isEqual(xor(schema1Keys, schema2Keys), ["items"])) {
                    const schemaWithoutItems = schema1Keys.length > schema2Keys.length ? schema2 : schema1;
                    const schemaWithItems = schema1Keys.length > schema2Keys.length ? schema1 : schema2;
                    const isSame = keys(schemaWithoutItems).reduce(
                        (acc, current) =>
                            isEqual(schemaWithoutItems[current], schemaWithItems[current]) && acc,
                        true
                    );
                    if (isSame) {
                        return schemaWithoutItems;
                    }
                }
            }
            if (schema1.type !== "object" || schema2.type !== "object") {
                return null;
            }
        }

        const retObj = {};
        for (let i = 0, { length } = schema1Keys; i < length; i++) {
            const key = schema1Keys[i];
            if (helpers.getType(schema1[key]) === "object") {
                const x = helpers.mergeSchemaObjs(schema1[key], schema2[key]);
                if (!x) {
                    if (schema1.type === "object" || schema2.type === "object") {
                        return { type: "object" };
                    }
                    // special treatment for array items. If not mergeable, we can do without them
                    if (key !== "items" || schema1.type !== "array" || schema2.type !== "array") {
                        return null;
                    }
                } else {
                    retObj[key] = x;
                }
            } else {
                // simple value schema properties (not defined by object)
                if (key === "type") {
                    // eslint-disable-line no-lonely-if
                    if (schema1[key] !== schema2[key]) {
                        if (
                            (schema1[key] === "integer" && schema2[key] === "number") ||
                            (schema1[key] === "number" && schema2[key] === "integer")
                        ) {
                            retObj[key] = "number";
                        } else {
                            return null;
                        }
                    } else {
                        retObj[key] = schema1[key];
                    }
                } else {
                    if (!isEqual(schema1[key], schema2[key])) {
                        return null;
                    }
                    retObj[key] = schema1[key];
                }
            }
        }
        return retObj;
    },
};

export interface Strings {
    detectFormat: boolean;
    preProcessFnc?: any;
}

export interface Arrays {
    mode: string;
}

export interface Objects {
    preProcessFnc?: any;
    postProcessFnc?: any;
    additionalProperties: boolean;
}

export interface SchemaOptions {
    required: boolean;
    postProcessFnc?: any;
    strings: Strings;
    arrays: Arrays;
    objects: Objects;
}

export interface JsonSchema {
    $ref?: string;
    /////////////////////////////////////////////////
    // Schema Metadata
    /////////////////////////////////////////////////
    /**
     * This is important because it tells refs where
     * the root of the document is located
     */
    id?: string;
    /**
     * It is recommended that the meta-schema is
     * included in the root of any JSON Schema
     */
    $schema?: JsonSchema;
    /**
     * Title of the schema
     */
    title?: string;
    /**
     * Schema description
     */
    description?: string;
    /**
     * Default json for the object represented by
     * this schema
     */
    default?: any;

    /////////////////////////////////////////////////
    // Number Validation
    /////////////////////////////////////////////////
    /**
     * The value must be a multiple of the number
     * (e.g. 10 is a multiple of 5)
     */
    multipleOf?: number;
    maximum?: number;
    /**
     * If true maximum must be > value, >= otherwise
     */
    exclusiveMaximum?: boolean;
    minimum?: number;
    /**
     * If true minimum must be < value, <= otherwise
     */
    exclusiveMinimum?: boolean;

    /////////////////////////////////////////////////
    // String Validation
    /////////////////////////////////////////////////
    maxLength?: number;
    minLength?: number;
    /**
     * This is a regex string that the value must
     * conform to
     */
    pattern?: string;

    /////////////////////////////////////////////////
    // Array Validation
    /////////////////////////////////////////////////
    additionalItems?: boolean | JsonSchema;
    items?: JsonSchema;
    maxItems?: number;
    minItems?: number;
    uniqueItems?: boolean;

    /////////////////////////////////////////////////
    // Object Validation
    /////////////////////////////////////////////////
    maxProperties?: number;
    minProperties?: number;
    required?: string[];
    additionalProperties?: boolean | JsonSchema;
    /**
     * Holds simple JSON Schema definitions for
     * referencing from elsewhere.
     */
    definitions?: { [key: string]: JsonSchema };
    /**
     * The keys that can exist on the object with the
     * json schema that should validate their value
     */
    properties?: { [property: string]: JsonSchema };
    /**
     * The key of this object is a regex for which
     * properties the schema applies to
     */
    patternProperties?: { [pattern: string]: JsonSchema };
    /**
     * If the key is present as a property then the
     * string of properties must also be present.
     * If the value is a JSON Schema then it must
     * also be valid for the object if the key is
     * present.
     */
    dependencies?: { [key: string]: JsonSchema | string[] };

    /////////////////////////////////////////////////
    // Generic
    /////////////////////////////////////////////////
    /**
     * Enumerates the values that this schema can be
     * e.g.
     * {"type": "string",
     *  "enum": ["red", "green", "blue"]}
     */
    enum?: any[];
    /**
     * The basic type of this schema, can be one of
     * [string, number, object, array, boolean, null]
     * or an array of the acceptable types
     */
    type?: string | string[];

    /////////////////////////////////////////////////
    // Combining Schemas
    /////////////////////////////////////////////////
    allOf?: JsonSchema[];
    anyOf?: JsonSchema[];
    oneOf?: JsonSchema[];
    /**
     * The entity being validated must not match this schema
     */
    not?: JsonSchema;
}

export class JsonSchemaItem {
    constructor(
        key: string,
        title?: string,
        type?: string | string[],
        description?: string,
        value?: any,
        required: boolean = false
    ) {
        this.key = key;
        title && (this.title = title);
        type && (this.type = type);
        description && (this.description = description);
        required && (this.required = required);
        value && (this.value = value);
    }
    /** 名称 */
    title?: string;
    /** 类型 */
    type?: string | string[] = "string";
    /** 是否必须 */
    required: boolean;
    /** 标识 */
    key: string;
    /** 值 */
    value?: string;
    /** 备注 */
    description?: string;
    /*** 子级 */
    children: JsonSchemaItem[] = [];
    name?: string;
    parentKey?: string;
    input?: {
        require: boolean
    };
    output?: {
        require: boolean
    };
}
