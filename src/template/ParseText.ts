import { cached } from "../storage/Cached";
import { parseFilters } from "./ParseFilters";
import { get, defaultsDeep, replace } from "lodash-es";

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;

const buildRegex = cached((delimiters) => {
    const open = delimiters[0].replace(regexEscapeRE, "\\$&");
    const close = delimiters[1].replace(regexEscapeRE, "\\$&");
    return new RegExp(open + "((?:.|\\n)+?)" + close, "g");
});

type TextParseResult = {
    expression: string;
    tokens: Array<string | { "@binding": string }>;
};

export function parseText(text: string, delimiters?: [string, string]): TextParseResult | void {
    //@ts-expect-error
    const tagRE = delimiters ? buildRegex(delimiters) : defaultTagRE;
    if (!tagRE.test(text)) {
        return;
    }
    const tokens: string[] = [];
    const rawTokens: any[] = [];
    let lastIndex = (tagRE.lastIndex = 0);
    let match, index, tokenValue;
    while ((match = tagRE.exec(text))) {
        index = match.index;
        // push text token
        if (index > lastIndex) {
            rawTokens.push((tokenValue = text.slice(lastIndex, index)));
            tokens.push(JSON.stringify(tokenValue));
        }
        // tag token
        const exp = parseFilters(match[1].trim());
        tokens.push(`_s(${exp})`);
        rawTokens.push({ "@binding": exp });
        lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
        rawTokens.push((tokenValue = text.slice(lastIndex)));
        tokens.push(JSON.stringify(tokenValue));
    }
    return {
        expression: tokens.join("+"),
        tokens: rawTokens,
    };
}
/** 处理模板变量值，替换变量值为默认值 */
export function renderText(template: string, ...objectVar: Object[]) {
    const vNode = parseText(template);
    const tempVar = defaultsDeep({}, ...objectVar);
    if (vNode) {
        const bindingVar = vNode.tokens.map((it) => {
            const tempStr = it["@binding"].replace(new RegExp("\\.", "g"), "______");
            vNode.expression = replace(vNode.expression, it["@binding"], tempStr);
            return tempStr;
        }) as string[];
        return new Function("_s", ...bindingVar, `return  ${vNode.expression}`)((text) => {
            return text?.toString() || "";
        }, ...bindingVar.map((it) => get(tempVar, it.replace(new RegExp("______", "g"), "."))));
    }
    return template;
}
