import * as zlib from 'zlib';

export class UnexpectedFormatError extends Error { }
export enum RGSSType {
    Unknow,
    Script
}
type ScriptPage = [number, String, string];
export function type(obj: any): RGSSType {
    if (obj instanceof Array) {
        let arr = <Array<Object>>obj;
        if (arr.every((obj) => obj instanceof (Array) && (<Array<Object>>obj).map((o) => o.constructor).every((x, i) => x === [Number, String, String][i]))) {
            return RGSSType.Script;
        }
    }
    return RGSSType.Unknow;
}
export function splitterScripts(arr: Array<ScriptPage>): Array<{ name: string, data: string }> {
    if (type(arr) !== RGSSType.Script) { throw new UnexpectedFormatError(); }
    return arr.map((page) =>{
        return {
            name:page[1].valueOf(),
            data:zlib.inflateSync(Buffer.from(page[2], 'latin1')).toString()
        };
    });
}