import * as Marshal from '../src/Marshal';
import * as assert from 'assert';
import {readFileSync } from 'fs';
import { resolve } from 'path';
import * as zlib from 'zlib';
suite("用法测试",()=>{
    test("new String(Buffer)",()=>{
        assert.equal(new String("abc").toString(),new String(Buffer.from("abc")).toString());
    });
});
var dir = "testResouse/";
var baseTest=(name:string,callback:(obj:any)=>any)=>
        test(name,()=>callback((Marshal.resolution(readFileSync(resolve(dir,name))))));
suite("Marshal Tests", function () {
    
    baseTest("./Fixnum",(num)=>assert.equal(num,2**22));
    baseTest("./Symbol",(str)=>assert.equal(str,":Symbol"));
    baseTest("./SymbolA",(str)=>assert.equal(str,":@Symbol"));
    baseTest("./Array",(array)=>assert.deepEqual(array,[null,true,false]));
    baseTest("./IString",(obj:any)=>{
        assert.equal(obj.valueOf(),"String");
        assert.equal(obj[":E"],true);
    });
    baseTest('./Scripts2.rvdata2',(arr)=>{
        assert.deepEqual(Buffer.from(arr[0][2],'latin1'),Buffer.from([0x78,0x9c,0x3,0,0,0,0,1]));
    });
});

suite("Marshal中文", function () {
    var CTest=(name:string,str:string)=>baseTest(name,(obj:any)=>{
        assert.equal(obj.valueOf(),str);
        assert.equal(obj[":E"],true);
    });
    CTest("./Symbol中文",":中文Symbol");
    CTest("./SymbolA中文",":@中文Symbol");
    CTest("./IString中文","中文String");
});

suite("zlib", function () {
    baseTest('./Scripts2.rvdata2',(arr)=>{
        assert.equal(zlib.inflateSync(Buffer.from(arr[0][2],'latin1')).toString(),"");
    });
});