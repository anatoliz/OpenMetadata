import * as vscode from 'vscode';
import { OpenMetadataAPI, OpenMetadataAPIError } from './openMetadataApi';
import { Task, ApiResponse, EntityType } from './types';
import { Logger } from './logger';
import { ErrorHandler } from './errorHandler';

/**
 * Represents an item in the task tree view.
 */
export class TaskTreeItem extends vscode.TreeItem {
    /**
     * Creates a new TaskTreeItem.
     * @param label - The label to display for this item.
     * @param taskId - The ID of the task (or a unique identifier for non-task items).
     * @param entityId - The ID of the associated entity (if applicable).
     * @param entityLink - The link to the associated entity (if applicable).
     * @param collapsibleState - The collapsible state of this item.
     * @param contextValue - A string used to determine the item's context menu.
     * @param description - An optional description for the item.
     */
    constructor(
        public readonly label: string,
        public readonly taskId: string,
        public readonly entityId: string,
        public readonly entityLink: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.description = description || this.taskId;
        this.iconPath = new vscode.ThemeIcon(this.getIconForItemType(contextValue));
        
        if (contextValue === 'openTask' || contextValue === 'completedTask') {
            this.contextValue = contextValue;
            this.command = {
                title: 'View Task Details',
                command: 'openmetadata-tasks.viewTaskDetails',
                arguments: [this]
            };
        }

        this.accessibilityInformation = {
            label: `${this.label} ${this.description || ''}`,
            role: 'treeitem'
        };
    }

    private getIconForItemType(type: string): string {
        switch (type) {
            case 'openTask': return 'circle-outline';
            case 'completedTask': return 'check';
            case 'project': return 'folder';
            default: return 'list-unordered';
        }
    }
}

/**
 * Provides data for the OpenMetadata task tree view.
 */
export class TaskTreeDataProvider implements vscode.TreeDataProvider<TaskTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TaskTreeItem | undefined | null | void> = new vscode.EventEmitter<TaskTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<TaskTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private taskCache: Map<string, Task[]> = new Map();
    private nextPageTokens: Map<string, string> = new Map();

    /**
     * Creates a new TaskTreeDataProvider.
     * @param api - The OpenMetadataAPI instance to use for fetching data.
     */
    constructor(private api: OpenMetadataAPI) {}

    /**
     * Refreshes the task tree view.
     */
    refresh(): void {
        this.taskCache.clear();
        this.nextPageTokens.clear();
        this._onDidChangeTreeData.fire();
    }

    /**
     * Gets the tree item for a given element.
     * @param element - The element to get the tree item for.
     * @returns The tree item for the given element.
     */
    getTreeItem(element: TaskTreeItem): vscode.TreeItem {
        return element;
    }

    /**
     * Gets the children of a given element.
     * @param element - The element to get children for (undefined for root).
     * @returns A promise that resolves to an array of TaskTreeItems.
     */
    async getChildren(element?: TaskTreeItem): Promise<TaskTreeItem[]> {
        if (!element) {
            return this.getRootItems();
        } else if (element.contextValue === 'project') {
            return this.getTasksForProject(element.taskId);
        } else if (element.contextValue === 'loadMore') {
            return this.loadMoreTasks(element.taskId);
        }
        return [];
    }

    /**
     * Gets the root items for the task tree.
     * @returns A promise that resolves to an array of TaskTreeItems.
     */
    private async getRootItems(): Promise<TaskTreeItem[]> {
        try {
            const response = await this.api.getTasks(1);
            const totalTasks = response.paging?.total || 0;
            return [
                new TaskTreeItem('All Tasks', 'all-tasks', '', '', vscode.TreeItemCollapsibleState.Collapsed, 'category', `(${totalTasks} tasks)`),
                new TaskTreeItem('Open Tasks', 'open-tasks', '', '', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
                new TaskTreeItem('Completed Tasks', 'completed-tasks', '', '', vscode.TreeItemCollapsibleState.Collapsed, 'category')
            ];
        } catch (error) {
            ErrorHandler.handle(error, 'Failed to fetch tasks');
            return [];
        }
    }

    /**
     * Caches tasks and updates the next page token.
     * @param key - The key to use for caching.
     * @param response - The API response containing tasks and pagination info.
     */
    private async cacheTasksAndUpdateNextPageToken(key: string, response: ApiResponse<Task[]>) {
        const tasks = this.taskCache.get(key) || [];
        this.taskCache.set(key, [...tasks, ...response.data]);
        if (response.paging?.after) {
            this.nextPageTokens.set(key, response.paging.after);
        } else {
            this.nextPageTokens.delete(key);
        }
    }

    /**
     * Creates tree items from cached tasks.
     * @param key - The key to use for retrieving cached tasks.
     * @returns An array of TaskTreeItems.
     */
    private createTreeItems(key: string): TaskTreeItem[] {
        const tasks = this.taskCache.get(key) || [];
        const groupedTasks = this.groupTasksByProject(tasks);
        const treeItems: TaskTreeItem[] = [];

        // Open tasks
        treeItems.push(new TaskTreeItem('Open Tasks', 'open-tasks', '', '', vscode.TreeItemCollapsibleState.Expanded, 'category'));

        for (const [projectName, projectTasks] of groupedTasks.entries()) {
            const openTasks = projectTasks.filter(task => task.status === 'Open');
            if (openTasks.length > 0) {
                treeItems.push(new TaskTreeItem(
                    projectName,
                    projectName,
                    '',
                    '',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'project',
                    `(${openTasks.length} open)`
                ));
            }
        }

        // Completed tasks
        treeItems.push(new TaskTreeItem('Completed Tasks', 'completed-tasks', '', '', vscode.TreeItemCollapsibleState.Collapsed, 'category'));

        for (const [projectName, projectTasks] of groupedTasks.entries()) {
            const completedTasks = projectTasks.filter(task => task.status === 'Closed');
            if (completedTasks.length > 0) {
                treeItems.push(new TaskTreeItem(
                    projectName,
                    projectName,
                    '',
                    '',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'project',
                    `(${completedTasks.length} completed)`
                ));
            }
        }

        if (this.nextPageTokens.has(key)) {
            treeItems.push(new TaskTreeItem('Load More...', key, '', '', vscode.TreeItemCollapsibleState.None, 'loadMore'));
        }

        return treeItems;
    }

    /**
     * Gets tasks for a specific project.
     * @param projectName - The name of the project to get tasks for.
     * @returns A promise that resolves to an array of TaskTreeItems.
     */
    private async getTasksForProject(projectName: string): Promise<TaskTreeItem[]> {
        const tasks = this.taskCache.get('root') || [];
        const projectTasks = tasks.filter(task => (task.project?.name || 'Ungrouped') === projectName);
        return projectTasks.map(task => new TaskTreeItem(
            task.name,
            task.id,
            task.entityId,
            task.entityLink,
            vscode.TreeItemCollapsibleState.None,
            task.status === 'Closed' ? 'completedTask' : 'openTask'
        ));
    }

    /**
     * Loads more tasks for a given key.
     * @param key - The key to load more tasks for.
     * @returns A promise that resolves to an array of TaskTreeItems.
     */
    private async loadMoreTasks(key: string): Promise<TaskTreeItem[]> {
        try {
            const nextPageToken = this.nextPageTokens.get(key);
            if (nextPageToken) {
                const response = await this.api.getTasks(20, nextPageToken);
                await this.cacheTasksAndUpdateNextPageToken(key, response);
                return this.createTreeItems(key);
            }
            return [];
        } catch (error) {
            ErrorHandler.handle(error, 'Failed to load more tasks');
            return [];
        }
    }

    /**
     * Groups tasks by project.
     * @param tasks - The tasks to group.
     * @returns A Map of project names to arrays of tasks.
     */
    private groupTasksByProject(tasks: Task[]): Map<string, Task[]> {
        const groupedTasks = new Map<string, Task[]>();
        tasks.forEach(task => {
            const projectName = task.project?.name || 'Ungrouped';
            if (!groupedTasks.has(projectName)) {
                groupedTasks.set(projectName, []);
            }
            groupedTasks.get(projectName)!.push(task);
        });
        return groupedTasks;
    }
}