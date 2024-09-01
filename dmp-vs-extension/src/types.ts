export interface Task {
    id: string;
    name: string;
    description: string;
    entityId: string;
    entityType: EntityType;
    status: 'Open' | 'Closed';
    type: string;
    assignees: User[];
    tags: Tag[];
    createdBy: User;
    createdAt: number;
    updatedAt: number;
    closedAt?: number;
    closedBy?: User;
    project?: Project;
    incident?: Incident;
}

export interface Asset {
    id: string;
    name: string;
    fullyQualifiedName: string;
    description: string;
    version: number;
    updatedAt: number;
    updatedBy: User;
    owner?: Owner;
    entityType: EntityType;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    fullyQualifiedName: string;
    displayName?: string;
    tasks: string[]; // Array of Task IDs
    status: 'Active' | 'Completed' | 'Deleted';
    version: number;
    updatedAt: number;
    updatedBy: User;
    owner?: Owner;
}

export interface Incident {
    id: string;
    name: string;
    description: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Open' | 'Closed';
    affectedEntities: string[]; // Array of affected entity IDs
    tasks: string[]; // Array of Task IDs
    assignees: User[]; // Array of Users
    createdBy: User;
    createdAt: number;
    updatedAt: number;
    resolvedAt?: number;
    resolvedBy?: User;
}

export interface User {
    id: string;
    name: string;
    email: string;
    displayName?: string;
}

export interface Owner {
    id: string;
    type: 'user' | 'team';
    name: string;
}

export interface Tag {
    tagFQN: string;
    labelType: 'Manual' | 'Derived' | 'Propagated' | 'Automated';
    state: 'Suggested' | 'Confirmed';
    source: string;
}

export enum EntityType {
    Table = 'table',
    Topic = 'topic',
    Dashboard = 'dashboard',
    Pipeline = 'pipeline',
    Mlmodel = 'mlmodel',
    Database = 'database',
    DatabaseSchema = 'databaseSchema',
    StoredProcedure = 'storedProcedure',
    Project = 'project',
    Incident = 'incident',
    User = 'user',
    Team = 'team',
    // Add other entity types as needed
}

export enum AssetType {
    SQL = 'sql',
    JSON = 'json',
    YAML = 'yaml',
    Other = 'other'
}

export interface ApiResponse<T> {
    data: T;
    paging?: {
        total: number;
        after?: string;
        before?: string;
    };
}

// Add more specific asset interfaces if needed
export interface TableAsset extends Asset {
    columns: Array<{
        name: string;
        dataType: string;
        description?: string;
    }>;
    // Add other table-specific fields
}

export interface DashboardAsset extends Asset {
    charts: Array<{
        id: string;
        name: string;
        type: string;
    }>;
    // Add other dashboard-specific fields
}

// Add other asset-specific interfaces as needed