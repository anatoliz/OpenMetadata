import * as vscode from 'vscode';
import { OpenMetadataAPI } from './openMetadataApi';

export class TaskWebview {
    private panel: vscode.WebviewPanel | undefined;
    private api: OpenMetadataAPI;

    constructor(private context: vscode.ExtensionContext, api: OpenMetadataAPI) {
        this.api = api;
    }

    public async show() {
        if (this.panel) {
            this.panel.reveal();
        } else {
            this.panel = vscode.window.createWebviewPanel(
                'openMetadataTasks',
                'OpenMetadata Tasks',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            this.panel.webview.html = this.getWebviewContent();
            this.panel.onDidDispose(() => {
                this.panel = undefined;
            });

            this.setupMessageHandling();
        }

        await this.updateTasks();
    }

    private setupMessageHandling() {
        this.panel!.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'authenticate':
                    await this.authenticate();
                    break;
                case 'getTasks':
                    await this.updateTasks();
                    break;
                case 'downloadAsset':
                    await this.downloadAsset(message.assetId);
                    break;
                case 'openInBrowser':
                    await this.openInBrowser(message.url);
                    break;
            }
        });
    }

    private async authenticate() {
        const token = await vscode.window.showInputBox({ prompt: 'Enter your JWT token', password: true });
        if (token) {
            try {
                const success = await this.api.authenticate(token);
                if (success) {
                    await this.context.secrets.store('openmetadata-jwt-token', token);
                    vscode.window.showInformationMessage('Authentication successful');
                    await this.updateTasks();
                } else {
                    vscode.window.showErrorMessage('Authentication failed');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    private async updateTasks() {
        if (!this.api.isAuthenticated()) {
            this.panel!.webview.postMessage({ command: 'updateTasks', tasks: [] });
            return;
        }

        try {
            const tasks = await this.api.getTasks();
            this.panel!.webview.postMessage({ command: 'updateTasks', tasks });
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async downloadAsset(assetId: string) {
        try {
            const asset = await this.api.getAsset(assetId);
            const fileName = `${asset.name}.json`;
            const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, fileName);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(JSON.stringify(asset, null, 2)));
            vscode.window.showInformationMessage(`Asset downloaded: ${fileName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error downloading asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async openInBrowser(url: string) {
        await vscode.env.openExternal(vscode.Uri.parse(url));
    }

    private getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>OpenMetadata Tasks</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    button { margin: 10px 0; }
                    #taskList { margin-top: 20px; }
                    .task { border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                <h1>OpenMetadata Tasks</h1>
                <button id="authenticateBtn">Authenticate</button>
                <button id="refreshBtn">Refresh Tasks</button>
                <div id="taskList"></div>
                <script>
                    const vscode = acquireVsCodeApi();

                    document.getElementById('authenticateBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'authenticate' });
                    });

                    document.getElementById('refreshBtn').addEventListener('click', () => {
                        vscode.postMessage({ command: 'getTasks' });
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateTasks':
                                updateTaskList(message.tasks);
                                break;
                        }
                    });

                    function updateTaskList(tasks) {
                        const taskList = document.getElementById('taskList');
                        taskList.innerHTML = '';
                        tasks.forEach(task => {
                            const taskElement = document.createElement('div');
                            taskElement.className = 'task';
                            taskElement.innerHTML = \`
                                <h3>\${task.name}</h3>
                                <p>\${task.description}</p>
                                <button onclick="downloadAsset('\${task.entityId}')">Download Asset</button>
                                <button onclick="openInBrowser('\${task.entityLink}')">Open in Browser</button>
                            \`;
                            taskList.appendChild(taskElement);
                        });
                    }

                    function downloadAsset(assetId) {
                        vscode.postMessage({ command: 'downloadAsset', assetId });
                    }

                    function openInBrowser(url) {
                        vscode.postMessage({ command: 'openInBrowser', url });
                    }
                </script>
            </body>
            </html>
        `;
    }
}