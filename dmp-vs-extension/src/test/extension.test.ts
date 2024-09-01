import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('YourPublisherName.openmetadata-tasks'));
    });

    test('Should activate extension', async () => {
        const ext = vscode.extensions.getExtension('YourPublisherName.openmetadata-tasks');
        await ext?.activate();
        assert.ok(true);
    });

    // Add more tests...
});