# OpenMetadata Tasks for VS Code

![OpenMetadata Tasks Extension](images/extension-banner.png)

## Overview

OpenMetadata Tasks is a Visual Studio Code extension that integrates OpenMetadata's task management capabilities directly into your development environment. This extension allows you to view, manage, and interact with OpenMetadata tasks without leaving VS Code.

## Features

- **Task Tree View**: Easily navigate through your OpenMetadata tasks, grouped by project and status.
- **Asset Integration**: View and download assets associated with tasks directly in VS Code.
- **Quick Actions**: Perform common actions like opening tasks in the OpenMetadata web application or downloading associated assets.
- **Authentication**: Securely authenticate with your OpenMetadata instance using JWT tokens.
- **Customizable Settings**: Configure the extension to suit your workflow.
- **Caching**: Improved performance with local caching of frequently accessed data.
- **Rate Limiting**: Prevents overwhelming the OpenMetadata API with requests.
- **Error Handling**: Robust error handling and user-friendly error messages.

![Task Tree View](images/task-tree-view.gif)

## Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Search for "OpenMetadata Tasks"
4. Click Install

## Configuration

Before using the extension, you need to configure it with your OpenMetadata instance details:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "OpenMetadata"
3. Fill in the following settings:
   - `openmetadata.apiUrl`: Your OpenMetadata API URL
   - `openmetadata.webAppUrl`: Your OpenMetadata Web Application URL
   - `openmetadata.refreshInterval`: Interval (in seconds) to refresh tasks automatically
   - `openmetadata.showNotifications`: Show notifications for task updates
   - `openmetadata.defaultView`: Default view for tasks (all, open, or completed)

![Configuration Settings](images/configuration-settings.png)

## Usage

### Authenticating

1. Open the Command Palette (Ctrl+Shift+P)
2. Search for "OpenMetadata: Authenticate"
3. Enter your JWT token when prompted

### Viewing Tasks

- Open the OpenMetadata Tasks view in the Explorer sidebar
- Tasks are grouped by project and status (Open/Completed)
- Click on a task to view its details

### Working with Assets

- Right-click on a task to see available actions
- Select "Download Asset" to download the associated asset to your workspace
- Select "Open in Browser" to view the task in the OpenMetadata web application

![Working with Assets](images/asset-actions.gif)

## Commands

- `OpenMetadata: Authenticate`: Authenticate with your OpenMetadata instance
- `OpenMetadata: Refresh Tasks`: Manually refresh the task list
- `OpenMetadata: Configure API`: Open settings to configure the API and Web App URLs
- `OpenMetadata: View Task Details`: View detailed information about a selected task
- `OpenMetadata: View Asset Details`: View detailed information about an asset associated with a task

## Troubleshooting

If you encounter any issues:

1. Check your API and Web App URL configurations
2. Ensure your authentication token is valid
3. Check the Output panel (View > Output) and select "OpenMetadata" from the dropdown for detailed logs
4. If you encounter rate limiting issues, try increasing the interval between API calls in the settings

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) file for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any problems or have any questions, please [open an issue](https://github.com/YourUsername/openmetadata-vscode-extension/issues) on our GitHub repository.

## Acknowledgements

This extension is built on top of the OpenMetadata project. We'd like to thank the OpenMetadata community for their excellent work.