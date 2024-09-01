import { OpenMetadataAPI } from './openMetadataApi';
import { Task, Asset, ApiResponse, AssetType, EntityType, User, Owner, Tag, Project, Incident } from './types';

export class MockOpenMetadataAPI extends OpenMetadataAPI {
    private mockTasks: Task[] = [
        {
            id: '1',
            name: 'Task 1',
            description: 'Description for Task 1',
            entityId: 'entity1',
            entityType: EntityType.Table,
            status: 'Open',
            type: 'Data Quality',
            assignees: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }],
            tags: [{ tagFQN: 'tag1', labelType: 'Manual', state: 'Confirmed', source: 'User' }],
            createdBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            project: { id: 'project1', name: 'Project A', description: 'Project A Description', fullyQualifiedName: 'ProjectA', tasks: ['1'], status: 'Active', version: 1, updatedAt: Date.now(), updatedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' } }
        },
        { id: '2', name: 'Task 2', description: 'Description for Task 2', entityId: 'entity2', entityType: EntityType.Dashboard, status: 'Open', type: 'Data Quality', assignees: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }], tags: [{ tagFQN: 'tag2', labelType: 'Manual', state: 'Confirmed', source: 'User' }], createdBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' }, createdAt: Date.now(), updatedAt: Date.now(), project: { id: 'project1', name: 'Project A', description: 'Project A Description', fullyQualifiedName: 'ProjectA', tasks: ['2'], status: 'Active', version: 1, updatedAt: Date.now(), updatedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' } } },
        { id: '3', name: 'Task 3', description: 'Description for Task 3', entityId: 'entity3', entityType: EntityType.StoredProcedure, status: 'Open', type: 'Data Quality', assignees: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }], tags: [{ tagFQN: 'tag3', labelType: 'Manual', state: 'Confirmed', source: 'User' }], createdBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' }, createdAt: Date.now(), updatedAt: Date.now(), project: { id: 'project2', name: 'Project B', description: 'Project B Description', fullyQualifiedName: 'ProjectB', tasks: ['3'], status: 'Active', version: 1, updatedAt: Date.now(), updatedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' } } },
        { id: '4', name: 'Task 4', description: 'Description for Task 4', entityId: 'entity4', entityType: EntityType.Table, status: 'Closed', type: 'Data Quality', assignees: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }], tags: [{ tagFQN: 'tag4', labelType: 'Manual', state: 'Confirmed', source: 'User' }], createdBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' }, createdAt: Date.now(), updatedAt: Date.now(), closedAt: Date.now(), closedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' }, project: { id: 'project2', name: 'Project B', description: 'Project B Description', fullyQualifiedName: 'ProjectB', tasks: ['4'], status: 'Active', version: 1, updatedAt: Date.now(), updatedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' } } },
        { id: '5', name: 'Task 5', description: 'Description for Task 5', entityId: 'entity5', entityType: EntityType.Dashboard, status: 'Closed', type: 'Data Quality', assignees: [{ id: 'user1', name: 'User 1', email: 'user1@example.com' }], tags: [{ tagFQN: 'tag5', labelType: 'Manual', state: 'Confirmed', source: 'User' }], createdBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' }, createdAt: Date.now(), updatedAt: Date.now(), closedAt: Date.now(), closedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' }, project: { id: 'project3', name: 'Project C', description: 'Project C Description', fullyQualifiedName: 'ProjectC', tasks: ['5'], status: 'Active', version: 1, updatedAt: Date.now(), updatedBy: { id: 'user2', name: 'User 2', email: 'user2@example.com' } } },
    ];

    private mockAssets: { [key: string]: Asset } = {
        'entity1': {
            id: 'entity1',
            name: 'Table 1',
            fullyQualifiedName: 'db.schema.table1',
            description: 'Description for Table 1',
            version: 1,
            updatedAt: Date.now(),
            updatedBy: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
            owner: { id: 'team1', type: 'team', name: 'Data Team' },
            entityType: EntityType.Table,
            content: 'CREATE TABLE table1 (id INT, name VARCHAR(255));',
            type: AssetType.SQL
        },
        'entity2': {
            id: 'entity2',
            name: 'Stored Procedure 1',
            fullyQualifiedName: 'db.schema.storedProcedure1',
            description: 'Description for Stored Procedure 1',
            version: 1,
            updatedAt: Date.now(),
            updatedBy: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
            owner: { id: 'team1', type: 'team', name: 'Data Team' },
            entityType: EntityType.StoredProcedure,
            content: 'CREATE PROCEDURE proc1() BEGIN SELECT * FROM table1; END;',
            type: AssetType.SQL
        },
        'entity3': {
            id: 'entity3',
            name: 'Dashboard 1',
            fullyQualifiedName: 'db.schema.dashboard1',
            description: 'Description for Dashboard 1',
            version: 1,
            updatedAt: Date.now(),
            updatedBy: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
            owner: { id: 'team1', type: 'team', name: 'Data Team' },
            entityType: EntityType.Dashboard,
            content: JSON.stringify({ charts: [{ name: 'Chart 1' }, { name: 'Chart 2' }] }, null, 2),
            type: AssetType.JSON
        },
        'entity4': {
            id: 'entity4',
            name: 'Table 2',
            fullyQualifiedName: 'db.schema.table2',
            description: 'Description for Table 2',
            version: 1,
            updatedAt: Date.now(),
            updatedBy: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
            owner: { id: 'team1', type: 'team', name: 'Data Team' },
            entityType: EntityType.Table,
            content: 'CREATE TABLE table2 (id INT, value FLOAT);',
            type: AssetType.SQL
        },
        'entity5': {
            id: 'entity5',
            name: 'Asset 5',
            fullyQualifiedName: 'db.schema.asset5',
            description: 'Description for Asset 5',
            version: 1,
            updatedAt: Date.now(),
            updatedBy: { id: 'user1', name: 'User 1', email: 'user1@example.com' },
            owner: { id: 'team1', type: 'team', name: 'Data Team' },
            entityType: EntityType.Other,
            content: JSON.stringify({ key: 'value' }, null, 2),
            type: AssetType.Other
        },
    };

    constructor() {
        super('http://mock-api.com', 'http://mock-webapp.com');
    }

    async authenticate(jwtToken: string): Promise<boolean> {
        return true;
    }

    isAuthenticated(): boolean {
        return true;
    }

    async getTasks(limit: number = 20, after?: string): Promise<ApiResponse<Task[]>> {
        const startIndex = after ? this.mockTasks.findIndex(t => t.id === after) + 1 : 0;
        const tasks = this.mockTasks.slice(startIndex, startIndex + limit);
        return {
            data: tasks,
            paging: {
                total: this.mockTasks.length,
                after: tasks.length > 0 ? tasks[tasks.length - 1].id : undefined
            }
        };
    }

    async updateTask(taskId: string, updateData: Partial<Task>): Promise<Task> {
        const taskIndex = this.mockTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error(`Task not found: ${taskId}`);
        }
        this.mockTasks[taskIndex] = { ...this.mockTasks[taskIndex], ...updateData };
        return this.mockTasks[taskIndex];
    }

    async getAsset(assetId: string): Promise<Asset> {
        const asset = this.mockAssets[assetId];
        if (!asset) {
            throw new Error(`Asset not found: ${assetId}`);
        }
        return asset;
    }

    async getAssetLineage(assetId: string, upstreamDepth: number = 1, downstreamDepth: number = 1): Promise<any> {
        return {
            upstreamEdges: [{ fromEntity: 'mockUpstreamEntity', toEntity: assetId }],
            downstreamEdges: [{ fromEntity: assetId, toEntity: 'mockDownstreamEntity' }],
        };
    }

    async searchAssets(query: string, index: string = 'all_entity_search_index', from: number = 0, size: number = 10): Promise<any> {
        const filteredAssets = Object.entries(this.mockAssets)
            .filter(([id, asset]) => asset.name.toLowerCase().includes(query.toLowerCase()))
            .slice(from, from + size);

        return {
            hits: {
                total: { value: filteredAssets.length },
                hits: filteredAssets.map(([id, asset]) => ({
                    _id: id,
                    _source: asset,
                })),
            },
        };
    }

    async getDataQualityTestResults(testCaseId: string, startTs?: number, endTs?: number): Promise<any> {
        return {
            testCaseId,
            results: [
                { timestamp: Date.now(), result: 'Success', testCaseName: 'Mock Test Case' },
            ],
        };
    }

    getTaskUrl(taskId: string): string {
        return `http://mock-webapp.com/tasks/${taskId}`;
    }

    getAssetUrl(assetId: string): string {
        return `http://mock-webapp.com/entity/${assetId}`;
    }

    async getTaskParentAsset(taskId: string): Promise<string | null> {
        const task = this.mockTasks.find(t => t.id === taskId);
        return task ? task.entityId : null;
    }

    async getIngestionBotToken(): Promise<string> {
        return 'mock-ingestion-bot-token';
    }

    async getAssetDetails(assetId: string): Promise<Asset> {
        const asset = this.mockAssets[assetId];
        if (!asset) {
            throw new Error(`Asset not found: ${assetId}`);
        }
        return asset;
    }

    private async getTableDDL(tableId: string): Promise<string> {
        const asset = this.mockAssets[tableId];
        if (asset && asset.entityType === EntityType.Table) {
            return asset.content;
        }
        throw new Error(`Table not found: ${tableId}`);
    }

    async getTaskDetails(taskId: string): Promise<Task> {
        const task = this.mockTasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task not found: ${taskId}`);
        }
        return task;
    }
}