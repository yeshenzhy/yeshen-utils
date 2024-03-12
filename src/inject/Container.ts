import { ClassConstructor } from "class-transformer";
import { Container } from "inversify";

export const container = new Container();

/** 创建一个新对象 */
export function createIns<T>(modelConstruct: ClassConstructor<T>) {
    return container.resolve(modelConstruct);
}
