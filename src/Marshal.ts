import { readdirSync, read } from "fs";
import { setFlagsFromString } from "v8";
type Next = (num: number) => number;
type Version = [number, number];
type Arg = {
    next: Next,
    version: Version,
    buffer: Buffer
};
export class Marshal {
    private static readNumber({ buffer, next, version }: Arg): number {
        var char = buffer.readInt8(next(1));
        if (char < -4 || char === 0 || char > 4) { return char === 0 ? 0 : char < 0 ? char + 5 : char - 5; }
        var arr: Array<number> = [];
        for (let i = 0; i < char; i++) { arr.push(buffer.readUInt8(next(1))); }
        var connect: (total: number, current: number) => number = (total: number, current: number) => (total << 8) + current;
        var result = arr.reduceRight(connect, 0);//小端序
        //TODO: 添加大端序
        if (char < 0) { result = -result; }
        return result;
    }
    private static readStringBuffer(args: Arg): Buffer {
        let length = this.readNumber(args);
        let start = args.next(length);
        let end = start + length;
        return args.buffer.slice(start, end);
    }
    private static read(args: Arg): any {
        let { next, buffer } = args;
        switch (buffer.readUInt8(next(1))) {
            case 0x69://Fixnum
                return this.readNumber(args);
            case 0x54://True
                return true;
            case 0x46://False
                return false;
            case 0x30://nil
                return null;
            case 0x5b: {//Array
                let arr = [];
                let length = this.readNumber(args);
                for (let i = 0; i < length; i++) { arr.push(this.read(args)); }
                return arr;
            } case 0x3a: {//Symbol
                return ':' + this.readStringBuffer(args).toString('latin1');
            } case 0x22: {//String
                return this.readStringBuffer(args).toString('latin1');
            } case 0x49: {//有自定义成员的拓展基本类型
                let obj = this.read(args);
                let opt: any = {};
                var num = this.readNumber(args);
                for (let i = 0; i < num; i++) { opt[this.read(args)] = this.read(args); }
                if (obj.constructor === String) {
                    if (opt[":E"] === true) {
                        obj = Buffer.from(obj, 'latin1').toString("utf8");
                    }
                    obj = new String(obj);
                } else if (obj.constructor === Number) {
                    obj = new Number(obj);
                }
                return Object.assign(obj, opt);
            }
            default: {
                throw new Error("未知的Marshal类型");
            }

        }
    }
    private static next(start: number): Next {
        return ((index) => (num: number) => (index += num) - num)(start);
    }
    public static load(buffer: Buffer) {
        var next = this.next(0);
        return this.read({
            buffer, next, version: [
                buffer.readUInt8(next(1)),
                buffer.readUInt8(next(1))
            ]
        });

    }
}