// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Marshal from './Marshal';
import * as Splitter from './Splitter';
import {promisify} from 'util';
import {readFile, writeFile } from 'fs';
import { resolve } from 'path';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('RGSSSplitter.splitter', async (file?: vscode.Uri) => {
		if (!file) {
			[file] = (await vscode.window.showOpenDialog({
				"filters": {
					"RGSS数据文件": ["rxdata", "rvdata", "rvdata2"]
				},
				//"canSelectFolders": false,
				"canSelectMany":false
			})) || [undefined];
			if (!file) { return; }
		}
		let obj;
		try {
			obj = Marshal.resolution(await promisify(readFile)(file.fsPath));
		} catch (e) {
			if (e instanceof Marshal.UnknowTypeError) {
				vscode.window.showErrorMessage(`未知的Marshal标识符:${e.type}`);
			} else/*(e instance of Marshal.ResolutionError)*/ {
				vscode.window.showErrorMessage("解析文件失败");
			}
		}
		switch (Splitter.type(obj)) {
			case (Splitter.RGSSType.Script):{
				try{
					let arr = Splitter.splitterScripts(obj);
					let [folder]= (await vscode.window.showOpenDialog({
						"canSelectFiles":false,
						"canSelectFolders":true,
						"canSelectMany":false
					}))||[undefined];
					if(folder===undefined){return;}
					await Promise.all(arr.map((obj)=>promisify(writeFile)(resolve((<vscode.Uri>folder).fsPath,`./${obj.name}.rb`),obj.data)));
					vscode.window.showInformationMessage("转换完成");
				}catch(e){
					if(e instanceof(Splitter.EmptyNameError)){
						vscode.window.showErrorMessage("有脚本页没名字");
					}else if(e instanceof(Splitter.DuplicatedScriptNameError)){
						vscode.window.showErrorMessage("脚本页重名");
					}
				}
				break;
			}
			default:
				vscode.window.showErrorMessage("还不能解包此种类型的文件>_<");
		}
	});

	context.subscriptions.push(disposable);
}
// this method is called when your extension is deactivated
export function deactivate() { }
