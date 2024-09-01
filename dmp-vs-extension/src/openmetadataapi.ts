import axios, { AxiosError } from 'axios';
import { Task, Asset, ApiResponse, AssetType, EntityType, Project, Incident } from './types';
import { RateLimiter } from './rateLimiter';
import { ErrorHandler } from './errorHandler';

/**
 * Custom error class for OpenMetadata API errors.
 */
export class OpenMetadataAPIError extends Error {
    constructor(message: string, public statusCode?: number) {
        super(message);
        this.name = 'OpenMetadataAPIError';
    }
}

/**
 * Main class for interacting with the OpenMetadata API.
 * @class
 */
export class OpenMetadataAPI {
    private baseUrl: string;
    private token: string;
    private webAppUrl: string;
    private rateLimiter: RateLimiter;
    private cache: Map<string, { data: any, timestamp: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Creates an instance of OpenMetadataAPI.
     * @param {string} baseUrl - The base URL of the OpenMetadata API.
     * @param {string} webAppUrl - The URL of the OpenMetadata web application.
     */
    constructor(baseUrl: string, webAppUrl: string) {
        this.baseUrl = baseUrl;
        this.webAppUrl = webAppUrl;
        this.token = '';
        this.rateLimiter = new RateLimiter(5, 1000); // 5 requests per second
    }

    /**
     * Makes an authenticated request to the OpenMetadata API.
     * @param {string} method - The HTTP method to use.
     * @param {string} endpoint - The API endpoint to call.
     * @param {any} [data] - Optional data to send with the request.
     * @returns {Promise<any>} The response data from the API.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    private async request(method: string, endpoint: string, data?: any): Promise<any> {
        await this.rateLimiter.wait();
        try {
            const response = await axios({
                method,
                url: `${this.baseUrl}/api/v1${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                data
            });
            return response.data;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Handles errors from API requests.
     * @param {unknown} error - The error object from the failed request.
     * @throws {OpenMetadataAPIError} With details about the error.
     */
    private handleError(error: unknown): never {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
                const statusCode = axiosError.response.status;
                let message = `Error ${statusCode}: ${axiosError.response.statusText}`;
                if (statusCode === 401) {
                    message += ". Please check your authentication token.";
                } else if (statusCode === 404) {
                    message += ". The requested resource was not found.";
                }
                throw new OpenMetadataAPIError(message, statusCode);
            } else if (axiosError.request) {
                throw new OpenMetadataAPIError('OpenMetadata API Error: No response received');
            }
        }
        throw new OpenMetadataAPIError('OpenMetadata API Error: Unknown error occurred');
    }

    /**
     * Parses the API response into a standardized format.
     * @param {any} response - The raw API response.
     * @returns {ApiResponse<T>} A standardized ApiResponse object.
     * @throws {OpenMetadataAPIError} If the response is invalid.
     */
    private parseResponse<T>(response: any): ApiResponse<T> {
        if (!response || typeof response !== 'object') {
            throw new OpenMetadataAPIError('Invalid API response');
        }
        
        const apiResponse: ApiResponse<T> = {
            data: response.data || response,
        };

        if (response.paging) {
            apiResponse.paging = {
                total: response.paging.total,
                after: response.paging.after,
                before: response.paging.before,
            };
        }

        return apiResponse;
    }

    /**
     * Authenticates with the OpenMetadata API using a JWT token.
     * @param {string} jwtToken - The JWT token to use for authentication.
     * @returns {Promise<boolean>} True if authentication was successful, false otherwise.
     * @throws {OpenMetadataAPIError} If the authentication request fails.
     */
    async authenticate(jwtToken: string): Promise<boolean> {
        try {
            const response = await axios.get(`${this.baseUrl}/api/v1/system/config/jwks`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });
            if (response.status >= 200 && response.status < 300) {
                this.token = jwtToken;
                return true;
            }
            return false;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Checks if the API client is currently authenticated.
     * @returns {boolean} True if authenticated, false otherwise.
     */
    isAuthenticated(): boolean {
        return !!this.token;
    }

    /**
     * Fetches tasks from the OpenMetadata API.
     * @param {number} [limit=20] - The maximum number of tasks to fetch.
     * @param {string} [after] - The pagination token for fetching the next page of results.
     * @returns {Promise<ApiResponse<Task[]>>} An ApiResponse containing the fetched tasks.
     * @throws {OpenMetadataAPIError} If not authenticated or if the request fails.
     */
    async getTasks(limit: number = 20, after?: string): Promise<ApiResponse<Task[]>> {
        if (!this.isAuthenticated()) {
            throw new OpenMetadataAPIError('Not authenticated. Please authenticate first.');
        }
        let endpoint = `/tasks?limit=${limit}`;
        if (after) endpoint += `&after=${after}`;
        const response = await this.request('GET', endpoint);
        return this.parseResponse<Task[]>(response);
    }

    /**
     * Updates a task in the OpenMetadata API.
     * @param {string} taskId - The ID of the task to update.
     * @param {Partial<Task>} updateData - The data to update on the task.
     * @returns {Promise<Task>} The updated task.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async updateTask(taskId: string, updateData: Partial<Task>): Promise<Task> {
        return this.request('PATCH', `/tasks/${taskId}`, updateData);
    }

    /**
     * Fetches an asset from the OpenMetadata API.
     * @param {string} assetId - The ID of the asset to fetch.
     * @returns {Promise<Asset>} The fetched asset.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async getAsset(assetId: string): Promise<Asset> {
        return this.request('GET', `/entities/${assetId}`);
    }

    /**
     * Fetches the lineage of an asset from the OpenMetadata API.
     * @param {string} assetId - The ID of the asset to fetch lineage for.
     * @param {number} [upstreamDepth=1] - The depth of upstream lineage to fetch.
     * @param {number} [downstreamDepth=1] - The depth of downstream lineage to fetch.
     * @returns {Promise<any>} The asset lineage data.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async getAssetLineage(assetId: string, upstreamDepth: number = 1, downstreamDepth: number = 1): Promise<any> {
        return this.request('GET', `/lineage/entities/${assetId}?upstreamDepth=${upstreamDepth}&downstreamDepth=${downstreamDepth}`);
    }

    /**
     * Searches for assets in the OpenMetadata API.
     * @param {string} query - The search query.
     * @param {string} [index='all_entity_search_index'] - The index to search in.
     * @param {number} [from=0] - The starting point for pagination.
     * @param {number} [size=10] - The number of results to return.
     * @returns {Promise<any>} The search results.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async searchAssets(query: string, index: string = 'all_entity_search_index', from: number = 0, size: number = 10): Promise<any> {
        return this.request('GET', `/search/query?q=${encodeURIComponent(query)}&index=${index}&from=${from}&size=${size}`);
    }

    /**
     * Fetches data quality test results from the OpenMetadata API.
     * @param {string} testCaseId - The ID of the test case.
     * @param {number} [startTs] - The start timestamp for filtering results.
     * @param {number} [endTs] - The end timestamp for filtering results.
     * @returns {Promise<any>} The test case results.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async getDataQualityTestResults(testCaseId: string, startTs?: number, endTs?: number): Promise<any> {
        let endpoint = `/dataQuality/testCases/${testCaseId}/testCaseResults`;
        if (startTs && endTs) {
            endpoint += `?startTs=${startTs}&endTs=${endTs}`;
        }
        return this.request('GET', endpoint);
    }

    /**
     * Gets the URL for a task in the OpenMetadata web application.
     * @param {string} taskId - The ID of the task.
     * @returns {string} The URL for the task in the web application.
     */
    getTaskUrl(taskId: string): string {
        return `${this.webAppUrl}/tasks/${taskId}`;
    }

    /**
     * Gets the URL for an asset in the OpenMetadata web application.
     * @param {string} assetId - The ID of the asset.
     * @returns {string} The URL for the asset in the web application.
     */
    getAssetUrl(assetId: string): string {
        return `${this.webAppUrl}/entity/${assetId}`;
    }

    /**
     * Fetches the parent asset of a task from the OpenMetadata API.
     * @param {string} taskId - The ID of the task.
     * @returns {Promise<string | null>} The ID of the parent asset, or null if not found.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async getTaskParentAsset(taskId: string): Promise<string | null> {
        try {
            const task = await this.request('GET', `/tasks/${taskId}`);
            return task.entityLink || null;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Fetches the ingestion bot token from the OpenMetadata API.
     * @returns {Promise<string>} The ingestion bot token.
     * @throws {OpenMetadataAPIError} If not authenticated or if the request fails.
     */
    async getIngestionBotToken(): Promise<string> {
        if (!this.isAuthenticated()) {
            throw new OpenMetadataAPIError('Not authenticated. Please authenticate first.');
        }
        try {
            const response = await this.request('GET', '/bots/name/ingestion-bot');
            if (response && response.botToken && response.botToken.token) {
                return response.botToken.token;
            }
            throw new OpenMetadataAPIError('Invalid response format for ingestion bot token');
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Fetches detailed information about an asset from the OpenMetadata API.
     * @param {string} assetId - The ID of the asset to fetch details for.
     * @returns {Promise<Asset>} Detailed asset information including content and type.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    async getAssetDetails(assetId: string): Promise<Asset> {
        try {
            const asset = await this.getAsset(assetId);
            let content = '';
            let type: AssetType = AssetType.Other;

            switch (asset.entityType) {
                case EntityType.Table:
                    content = await this.getTableDDL(assetId);
                    type = AssetType.SQL;
                    break;
                case EntityType.StoredProcedure:
                    content = (asset as any).storedProcedureCode || '';
                    type = AssetType.SQL;
                    break;
                case EntityType.Dashboard:
                    content = JSON.stringify((asset as DashboardAsset).charts, null, 2);
                    type = AssetType.JSON;
                    break;
                default:
                    content = JSON.stringify(asset, null, 2);
                    type = AssetType.Other;
            }

            return {
                ...asset,
                content,
                type
            } as Asset;
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Fetches the DDL (Data Definition Language) for a table from the OpenMetadata API.
     * @param {string} tableId - The ID of the table.
     * @returns {Promise<string>} The DDL for the table.
     * @throws {OpenMetadataAPIError} If the request fails.
     */
    private async getTableDDL(tableId: string): Promise<string> {
        try {
            const response = await this.request('GET', `/tables/${tableId}/tableProfile/ddl`);
            return response.ddl || '';
        } catch (error) {
            return this.handleError(error);
        }
    }

    private async cachedRequest(key: string, requestFn: () => Promise<any>): Promise<any> {
        const cachedData = this.cache.get(key);
        if (cachedData && Date.now() - cachedData.timestamp < this.CACHE_TTL) {
            return cachedData.data;
        }

        const data = await requestFn();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    async getTasks(limit: number = 20, after?: string): Promise<ApiResponse<Task[]>> {
        const cacheKey = `tasks_${limit}_${after || ''}`;
        return this.cachedRequest(cacheKey, () => {
            if (!this.isAuthenticated()) {
                throw new OpenMetadataAPIError('Not authenticated. Please authenticate first.');
            }
            let endpoint = `/tasks?limit=${limit}`;
            if (after) endpoint += `&after=${after}`;
            const response = this.request('GET', endpoint);
            return this.parseResponse<Task[]>(response);
        });
    }

    async getTaskDetails(taskId: string): Promise<Task> {
        const cacheKey = `task_${taskId}`;
        return this.cachedRequest(cacheKey, () => {
            return this.request('GET', `/tasks/${taskId}`);
        });
    }

    async getAsset(assetId: string): Promise<Asset> {
        const cacheKey = `asset_${assetId}`;
        return this.cachedRequest(cacheKey, () => {
            return this.request('GET', `/entities/${assetId}`);
        });
    }

    async getAssetLineage(assetId: string, upstreamDepth: number = 1, downstreamDepth: number = 1): Promise<any> {
        const cacheKey = `asset_lineage_${assetId}_${upstreamDepth}_${downstreamDepth}`;
        return this.cachedRequest(cacheKey, () => {
            return this.request('GET', `/lineage/entities/${assetId}?upstreamDepth=${upstreamDepth}&downstreamDepth=${downstreamDepth}`);
        });
    }

    async searchAssets(query: string, index: string = 'all_entity_search_index', from: number = 0, size: number = 10): Promise<any> {
        const cacheKey = `search_${query}_${index}_${from}_${size}`;
        return this.cachedRequest(cacheKey, () => {
            return this.request('GET', `/search/query?q=${encodeURIComponent(query)}&index=${index}&from=${from}&size=${size}`);
        });
    }

    async getDataQualityTestResults(testCaseId: string, startTs?: number, endTs?: number): Promise<any> {
        let endpoint = `/dataQuality/testCases/${testCaseId}/testCaseResults`;
        if (startTs && endTs) {
            endpoint += `?startTs=${startTs}&endTs=${endTs}`;
        }
        const cacheKey = `data_quality_${testCaseId}_${startTs}_${endTs}`;
        return this.cachedRequest(cacheKey, () => {
            return this.request('GET', endpoint);
        });
    }

    async getIngestionBotToken(): Promise<string> {
        const cacheKey = 'ingestion_bot_token';
        return this.cachedRequest(cacheKey, () => {
            if (!this.isAuthenticated()) {
                throw new OpenMetadataAPIError('Not authenticated. Please authenticate first.');
            }
            try {
                const response = this.request('GET', '/bots/name/ingestion-bot');
                if (response && response.botToken && response.botToken.token) {
                    return response.botToken.token;
                }
                throw new OpenMetadataAPIError('Invalid response format for ingestion bot token');
            } catch (error) {
                return this.handleError(error);
            }
        });
    }

    async getAssetDetails(assetId: string): Promise<Asset> {
        const cacheKey = `asset_details_${assetId}`;
        return this.cachedRequest(cacheKey, () => {
            try {
                const asset = this.getAsset(assetId);
                let content = '';
                let type: AssetType = AssetType.Other;

                switch (asset.entityType) {
                    case EntityType.Table:
                        content = this.getTableDDL(assetId);
                        type = AssetType.SQL;
                        break;
                    case EntityType.StoredProcedure:
                        content = (asset as any).storedProcedureCode || '';
                        type = AssetType.SQL;
                        break;
                    case EntityType.Dashboard:
                        content = JSON.stringify((asset as DashboardAsset).charts, null, 2);
                        type = AssetType.JSON;
                        break;
                    default:
                        content = JSON.stringify(asset, null, 2);
                        type = AssetType.Other;
                }

                return {
                    ...asset,
                    content,
                    type
                } as Asset;
            } catch (error) {
                return this.handleError(error);
            }
        });
    }

    private async getTableDDL(tableId: string): Promise<string> {
        const cacheKey = `table_ddl_${tableId}`;
        return this.cachedRequest(cacheKey, () => {
            try {
                const response = this.request('GET', `/tables/${tableId}/tableProfile/ddl`);
                return response.ddl || '';
            } catch (error) {
                return this.handleError(error);
            }
        });
    }
}