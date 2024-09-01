import * as vscode from 'vscode';
import { OpenMetadataAPI } from './openMetadataApi';

export class TokenManager {
    private static readonly TOKEN_KEY = 'openmetadata-jwt-token';
    private static readonly REFRESH_INTERVAL = 1000 * 60 * 60; // 1 hour

    constructor(private context: vscode.ExtensionContext, private api: OpenMetadataAPI) {
        this.startTokenRefreshInterval();
    }

    private async encryptToken(token: string): Promise<string> {
        // Implement encryption logic here
        return token; // Placeholder
    }

    private async decryptToken(encryptedToken: string): Promise<string> {
        // Implement decryption logic here
        return encryptedToken; // Placeholder
    }

    async getToken(): Promise<string | undefined> {
        const encryptedToken = await this.context.secrets.get(TokenManager.TOKEN_KEY);
        return encryptedToken ? this.decryptToken(encryptedToken) : undefined;
    }

    async setToken(token: string): Promise<void> {
        const encryptedToken = await this.encryptToken(token);
        await this.context.secrets.store(TokenManager.TOKEN_KEY, encryptedToken);
    }

    async clearToken(): Promise<void> {
        await this.context.secrets.delete(TokenManager.TOKEN_KEY);
    }

    private startTokenRefreshInterval() {
        setInterval(async () => {
            await this.refreshToken();
        }, TokenManager.REFRESH_INTERVAL);
    }

    private async refreshToken() {
        const token = await this.getToken();
        if (token) {
            try {
                const newToken = await this.api.refreshToken(token);
                if (newToken) {
                    await this.setToken(newToken);
                    vscode.window.showInformationMessage('OpenMetadata token refreshed successfully.');
                } else {
                    await this.clearToken();
                    vscode.window.showWarningMessage('OpenMetadata token has expired. Please authenticate again.');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to refresh OpenMetadata token: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
}