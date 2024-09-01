import * as vscode from 'vscode';
import { OpenMetadataAPI } from './openMetadataApi';
import { MockOpenMetadataAPI } from './mockOpenMetadataApi';
import { TaskTreeDataProvider, TaskTreeItem } from './taskTreeDataProvider';
import { TokenManager } from './tokenManager';
import { Logger } from './logger';
import { showDetailsWebview } from './detailsWebview';

let openMetadataApi: OpenMetadataAPI;
let taskTreeDataProvider: TaskTreeDataProvider;
let tokenManager: TokenManager;
let statusBarItem: vscode.StatusBarItem;

/**
 * Activates the extension.
 * This function is called when the extension is activated.
 * It initializes the API, sets up the token manager, and registers commands.
 * @param context - The extension context provided by VS Code.
 */
export async function activate(context: vscode.ExtensionContext) {
    Logger.initialize();

    /**
     * Validates the OpenMetadata configuration.
     * @param config - The workspace configuration.
     * @returns An object containing the validated API URL and Web Application URL.
     * @throws Error if the configuration is invalid.
     */
    function validateConfiguration(config: vscode.WorkspaceConfiguration): { apiUrl: string, webAppUrl: string } {
        const apiUrl = config.get<string>('apiUrl');
        const webAppUrl = config.get<string>('webAppUrl');

        if (!apiUrl || !webAppUrl) {
            throw new Error('OpenMetadata API URL and Web Application URL must be configured.');
        }

        try {
            new URL(apiUrl);
            new URL(webAppUrl);
        } catch (error) {
            throw new Error('Invalid API URL or Web Application URL');
        }

        return { apiUrl, webAppUrl };
    }

    /**
     * Initializes the OpenMetadata API client.
     * This function sets up either the mock API for development or the real API for production.
     */
    async function initializeApi() {
        try {
            if (process.env.NODE_ENV === 'development') {
                openMetadataApi = new MockOpenMetadataAPI();
                Logger.log('Using Mock OpenMetadata API for development');
            } else {
                const { apiUrl, webAppUrl } = validateConfiguration(vscode.workspace.getConfiguration('openmetadata'));
                openMetadataApi = new OpenMetadataAPI(apiUrl, webAppUrl);
            }
            taskTreeDataProvider = new TaskTreeDataProvider(openMetadataApi);
            vscode.window.registerTreeDataProvider('openMetadataTasks', taskTreeDataProvider);
        } catch (error) {
            Logger.log(`Failed to initialize OpenMetadata API: ${error instanceof Error ? error.message : 'Unknown error'}`);
            vscode.window.showErrorMessage(`Failed to initialize OpenMetadata API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Authenticates with the OpenMetadata API using a stored token.
     * This function is called on extension activation to attempt automatic authentication.
     */
    async function authenticateWithStoredToken() {
        const storedToken = await tokenManager.getToken();
        if (storedToken && openMetadataApi) {
            try {
                const isAuthenticated = await openMetadataApi.authenticate(storedToken);
                if (isAuthenticated) {
                    Logger.log('Successfully authenticated with OpenMetadata');
                    vscode.window.showInformationMessage('Successfully authenticated with OpenMetadata');
                    taskTreeDataProvider.refresh();
                } else {
                    Logger.log('Stored token is invalid');
                    vscode.window.showWarningMessage('Stored token is invalid. Please authenticate again.');
                    await tokenManager.clearToken();
                }
            } catch (error) {
                Logger.log(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                vscode.window.showErrorMessage(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    try {
        await initializeApi();
        tokenManager = new TokenManager(context, openMetadataApi);
        await authenticateWithStoredToken();
    } catch (error) {
        Logger.log(`Failed to initialize extension: ${error instanceof Error ? error.message : 'Unknown error'}`);
        vscode.window.showErrorMessage(`Failed to initialize extension: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    context.subscriptions.push(statusBarItem);
    updateStatusBar(false);

    /**
     * Registers a command with error handling.
     * This function wraps command callbacks with error handling to prevent unhandled exceptions.
     * @param context - The extension context.
     * @param command - The command ID.
     * @param callback - The command callback.
     */
    function registerCommand(context: vscode.ExtensionContext, command: string, callback: (...args: any[]) => any) {
        const wrappedCallback = async (...args: any[]) => {
            try {
                await callback(...args);
            } catch (error) {
                Logger.log(`Error executing command ${command}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                vscode.window.showErrorMessage(`Error executing command ${command}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        };
        context.subscriptions.push(vscode.commands.registerCommand(command, wrappedCallback));
    }

    // Register commands
    registerCommand(context, 'openmetadata-tasks.configure', async () => {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'openmetadata');
    });

    registerCommand(context, 'openmetadata-tasks.authenticate', async () => {
        if (!openMetadataApi) {
            vscode.window.showErrorMessage('OpenMetadata API is not initialized. Please configure the API URL first.');
            return;
        }

        const token = await vscode.window.showInputBox({ prompt: 'Enter your JWT token', password: true });
        if (token) {
            try {
                const success = await openMetadataApi.authenticate(token);
                if (success) {
                    await context.secrets.store('openmetadata-jwt-token', token);
                    vscode.window.showInformationMessage('Authentication successful');
                    taskTreeDataProvider.refresh();
                } else {
                    vscode.window.showErrorMessage('Authentication failed');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    });

    registerCommand(context, 'openmetadata-tasks.refreshTasks', async () => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Refreshing tasks...",
            cancellable: false
        }, async (progress) => {
            taskTreeDataProvider.refresh();
        });
    });

    registerCommand(context, 'openmetadata-tasks.downloadAsset', async (item: TaskTreeItem) => {
        if (item.contextValue !== 'openTask' && item.contextValue !== 'completedTask') {
            vscode.window.showErrorMessage('This item does not have an associated asset.');
            return;
        }

        try {
            const assetDetails = await openMetadataApi.getAssetDetails(item.entityId);
            const fileName = `${assetDetails.name}.${assetDetails.type}`;
            const filePath = vscode.Uri.joinPath(vscode.workspace.workspaceFolders![0].uri, fileName);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(assetDetails.content));
            vscode.window.showInformationMessage(`Asset downloaded: ${fileName}`);
            
            // Open the downloaded file in the editor
            const document = await vscode.workspace.openTextDocument(filePath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Error downloading asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    registerCommand(context, 'openmetadata-tasks.openInBrowser', (item: TaskTreeItem) => {
        if (item.contextValue !== 'openTask' && item.contextValue !== 'completedTask') {
            vscode.window.showErrorMessage('This item does not have an associated link.');
            return;
        }
        vscode.env.openExternal(vscode.Uri.parse(item.entityLink));
    });

    registerCommand(context, 'openmetadata-tasks.loadMore', () => {
        // This command is triggered automatically by VS Code when the "Load More..." item is clicked
    });

    registerCommand(context, 'openmetadata-tasks.viewTaskDetails', async (item: TaskTreeItem) => {
        if (item.contextValue !== 'openTask' && item.contextValue !== 'completedTask') {
            vscode.window.showErrorMessage('This item does not have associated details.');
            return;
        }

        try {
            const taskDetails = await openMetadataApi.getTaskDetails(item.taskId);
            showDetailsWebview(context, `Task Details: ${item.label}`, JSON.stringify(taskDetails, null, 2));
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching task details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    registerCommand(context, 'openmetadata-tasks.viewAssetDetails', async (item: TaskTreeItem) => {
        if (item.contextValue !== 'openTask' && item.contextValue !== 'completedTask') {
            vscode.window.showErrorMessage('This item does not have an associated asset.');
            return;
        }

        try {
            const assetDetails = await openMetadataApi.getAssetDetails(item.entityId);
            showDetailsWebview(context, `Asset Details: ${assetDetails.name}`, assetDetails.content);
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching asset details: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // Watch for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('openmetadata')) {
                initializeApi();
            }
        })
    );

    // Try to authenticate with stored token on activation
    context.secrets.get('openmetadata-jwt-token').then(async (storedToken) => {
        if (storedToken && openMetadataApi) {
            try {
                const isAuthenticated = await openMetadataApi.authenticate(storedToken);
                if (isAuthenticated) {
                    Logger.log('Successfully authenticated with OpenMetadata');
                    vscode.window.showInformationMessage('Successfully authenticated with OpenMetadata');
                    taskTreeDataProvider.refresh();
                } else {
                    Logger.log('Stored token is invalid');
                    vscode.window.showWarningMessage('Stored token is invalid. Please authenticate again.');
                }
            } catch (error) {
                Logger.log(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                vscode.window.showErrorMessage(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    });
}

function updateStatusBar(connected: boolean) {
    statusBarItem.text = connected ? "$(check) OpenMetadata" : "$(x) OpenMetadata";
    statusBarItem.command = connected ? 'openmetadata-tasks.refreshTasks' : 'openmetadata-tasks.connect';
    statusBarItem.show();
}

/**
 * Deactivates the extension.
 * This function is called when the extension is deactivated.
 * It can be used to clean up resources if needed.
 */
export function deactivate() {}