import * as vscode from 'vscode';
import { OpenAIApi, Configuration } from 'openai';

require('dotenv').config({ path: __dirname+'/../.env' });

const configuration = new Configuration({
	organization: process.env.OPENAI_API_ORG,
	apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "funplug" is now active!');

	let disposable = vscode.commands.registerCommand('funplug.Activate', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found.');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText.trim()) {
            vscode.window.showErrorMessage('No text selected. Please select a function comment to convert.');
            return;
        }

		fetchFunctionImplementation(selectedText)
		.then((functionImplementation) => {
			if (functionImplementation) {
				editor.edit((editBuilder) => {
					// Append the function implementation just below the selected text
					const position = new vscode.Position(selection.start.line - 1, 0);
					editBuilder.insert(position, `\n${functionImplementation}`);
				});
			} else {
				vscode.window.showErrorMessage('Failed to retrieve function implementation from ChatGPT API.');
			}
		})
		.catch((error) => {
			console.error('An error occurred while fetching the function implementation:', error);
			vscode.window.showErrorMessage('An error occurred while fetching the function implementation.');
		});
	});

	//vscode.window.showInformationMessage('Hello World from funplug!');
	
	context.subscriptions.push(disposable);
}
 
async function fetchFunctionImplementation(promptText: string): Promise<string|undefined> {

	const result = await openai.createChatCompletion({
		model: 'gpt-3.5-turbo',
		messages: [
			{role: 'system', content: 'You are a professional developer'}, 
			{role: 'user', content: 'Create javadoc comments for the function ' + promptText}
		],
	  });

	return result.data.choices.shift()?.message?.content;
};

export function deactivate() {}
