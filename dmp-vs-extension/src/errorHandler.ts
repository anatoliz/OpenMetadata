import * as vscode from 'vscode';
import { Logger } from './logger';

export class ErrorHandler {
    static handle(error: unknown, message: string): void {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        Logger.log(`${message}: ${errorMessage}`);
        vscode.window.showErrorMessage(`${message}: ${errorMessage}`);
    }
}