import * as vscode from 'vscode';

export function showDetailsWebview(context: vscode.ExtensionContext, title: string, content: string) {
    const panel = vscode.window.createWebviewPanel(
        'openMetadataDetails',
        title,
        vscode.ViewColumn.One,
        { enableScripts: true }
    );
    panel.webview.html = getWebviewContent(title, content);
}

function getWebviewContent(title: string, content: string) {
    return `<!DOCTYPE html>
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
    </html>`;
}