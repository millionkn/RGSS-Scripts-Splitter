type Counter = (num: number) => number;
type Version = [number, number];
type Arg = {
    next: Counter,
    version: Version,
    buffer: Buffer
};
export class UnknowTypeError extends Error{
    public type:string;
    constructor(type:string){
        super(type);
        this.type=type;
    }
}
export class ResolutionError extends Error{}
export function resolution(buffer: Buffer) {
    var next = Counter(0);
    try{
        return read({
            buffer, next, version: [
                buffer.readUInt8(next(1)),
                buffer.readUInt8(next(1))
            ]
        });
    }catch(e){
        if(e instanceof UnknowTypeError){
            throw e;
        }else{
            throw new ResolutionError();
        }
    }
    

}

function readNumber({ buffer, next}: Arg): number {
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
function readStringBuffer(args: Arg): Buffer {
    let length = readNumber(args);
    let start = args.next(length);
    let end = start + length;
    return args.buffer.slice(start, end);
}
function read(args: Arg): any {
    let { next, buffer } = args;
    let type=buffer.readUInt8(next(1));
    switch (type) {
        case 0x69://Fixnum
            return readNumber(args);
        case 0x54://True
            return true;
        case 0x46://False
            return false;
        case 0x30://nil
            return null;
        case 0x5b: {//Array
            let arr = [];
            let length = readNumber(args);
            for (let i = 0; i < length; i++) { arr.push(read(args)); }
            return arr;
        } case 0x3a: {//Symbol
            return ':' + readStringBuffer(args).toString('latin1');
        } case 0x22: {//String
            return readStringBuffer(args).toString('latin1');
        } case 0x49: {//有自定义成员的拓展基本类型
            let obj = read(args);
            let opt: any = {};
            var num = readNumber(args);
            for (let i = 0; i < num; i++) { opt[read(args)] = read(args); }
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
            throw new UnknowTypeError(`0x${type.toString(16)}`);
        }

    }
}
function Counter(start: number): Counter{
    return ((index) => (num: number) => (index += num) - num)(start);
}
