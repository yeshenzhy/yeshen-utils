export class ArrayString {
    public index(index: number): any {
        return this.value[index];
    }
    public value: string[];
    constructor(str: string) {
        this.value = str.split("||").map(it => it.replace('|', ""));
    }
    toString(): string {
        return "|" + this.value.join("||") + "|";
    }
}
