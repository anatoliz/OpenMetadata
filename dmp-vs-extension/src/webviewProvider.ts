import * as vscode from 'vscode';

export class WebviewProvider {
    static createWebview(context: vscode.ExtensionContext, title: string, content: string): vscode.WebviewPanel {
        const panel = vscode.window.createWebviewPanel(
            'openmetadataView',
            title,
            vscode.ViewColumn.One,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.getWebviewContent(title, content);
        return panel;
    }

    private static getWebviewContent(title: string, content: string): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
            </head>
            <body>
                <h1>${title}</h1>
                <pre>${content}</pre>
            </body>
            </html>
        `;
    }
}