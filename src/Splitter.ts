import * as fs from "fs";
import * as zlib from 'zlib';
import * as Marshal from './Marshal';
import { resolve } from "path";
export enum RGSSType {
    Unknow,
    Script
}
type ScriptPage = [number, string, string];
export class DuplicatedScriptNameError extends Error { }
export class EmptyNameError extends Error { }

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
    if (type(arr) !== RGSSType.Script) { throw new Error("非预期格式"); }
    let names = arr.map((page) => (<ScriptPage>page)[1]);
    if (names.includes("")) { throw new EmptyNameError(); }
    let duplicated = names.filter((name, index) => names.includes(name, index + 1));
    if (duplicated.length !== 0) { throw new DuplicatedScriptNameError(`${[...new Set(duplicated)]}`); }
    try {
        return arr.map((page) =>{
            return {
                name:page[1],
                data:zlib.inflateSync(Buffer.from(page[2], 'latin1')).toString()
            };
        });
    } catch (e) {
        throw e;
    }
}