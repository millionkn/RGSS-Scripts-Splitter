// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as zlib from 'zlib';

const Marshal = require("marshal");

import {readFileSync, readFile} from 'fs';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('"RGSSScriptSplitter" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('RGSSSplitter.splitter',async (file?:vscode.Uri) => {
		// The code you place here will be executed every time your command is executed
		if(!file){
			[file] = (await vscode.window.showOpenDialog({
				"filters":{
					"RGSS数据文件":["rxdata","rvdata","rvdata2"]
				},
				"canSelectFiles":false
			}))||[undefined];
			if(!file){
				return;
			}
		}
		try{
			var str = readFileSync(file.fsPath);
			var json = new Marshal(str,{encoding:null},null).toJSON();
			// var results:Array<{
			// 	number:Number,
			// 	name:String,
			// 	code:String
			// }> = new Marshal(readFileSync(file.fsPath),null).toJSON().map(([num,name,zipcode]:any)=>{
			// 	var buffer = Buffer.from(zipcode);
			// 	return {num,name,code:zlib.inflateSync(buffer).toString()};
			// });
			console.log(json);
		}catch(e){
			vscode.window.showErrorMessage("只能解包基本数据类型");
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
