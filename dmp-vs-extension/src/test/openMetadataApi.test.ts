import { OpenMetadataAPI, OpenMetadataAPIError } from '../openMetadataApi';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('OpenMetadataAPI', () => {
    let api: OpenMetadataAPI;
    let mock: MockAdapter;

    beforeEach(() => {
        api = new OpenMetadataAPI('http://api.example.com', 'http://webapp.example.com');
        mock = new MockAdapter(axios);
    });

    afterEach(() => {
        mock.reset();
    });

    test('authenticate success', async () => {
        mock.onGet('http://api.example.com/api/v1/system/config/jwks').reply(200);
        const result = await api.authenticate('valid_token');
        expect(result).toBe(true);
        expect(api.isAuthenticated()).toBe(true);
    });

    test('authenticate failure', async () => {
        mock.onGet('http://api.example.com/api/v1/system/config/jwks').reply(401);
        await expect(api.authenticate('invalid_token')).rejects.toThrow(OpenMetadataAPIError);
        expect(api.isAuthenticated()).toBe(false);
    });

    test('getTasks success', async () => {
        mock.onGet('http://api.example.com/api/v1/tasks?limit=20').reply(200, { data: [{ id: '1', name: 'Task 1' }], paging: { total: 1 } });
        await api.authenticate('valid_token');
        const result = await api.getTasks();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].name).toBe('Task 1');
    });

    test('getTasks not authenticated', async () => {
        await expect(api.getTasks()).rejects.toThrow('Not authenticated');
    });

    test('updateTask success', async () => {
        mock.onPatch('http://api.example.com/api/v1/tasks/1').reply(200, { id: '1', name: 'Updated Task' });
        await api.authenticate('valid_token');
        const result = await api.updateTask('1', { name: 'Updated Task' });
        expect(result.name).toBe('Updated Task');
    });

    test('getAsset success', async () => {
        mock.onGet('http://api.example.com/api/v1/entities/asset1').reply(200, { id: 'asset1', name: 'Asset 1' });
        await api.authenticate('valid_token');
        const result = await api.getAsset('asset1');
        expect(result.name).toBe('Asset 1');
    });

    test('getAssetDetails success', async () => {
        mock.onGet('http://api.example.com/api/v1/entities/asset1').reply(200, { name: 'Asset 1', entityType: 'table' });
        mock.onGet('http://api.example.com/api/v1/tables/asset1/tableProfile/ddl').reply(200, { ddl: 'CREATE TABLE asset1;' });
        await api.authenticate('valid_token');
        const result = await api.getAssetDetails('asset1');
        expect(result.name).toBe('Asset 1');
        expect(result.content).toBe('CREATE TABLE asset1;');
        expect(result.type).toBe('sql');
    });

    test('getAssetDetails failure', async () => {
        mock.onGet('http://api.example.com/api/v1/entities/asset1').reply(404);
        await api.authenticate('valid_token');
        await expect(api.getAssetDetails('asset1')).rejects.toThrow(OpenMetadataAPIError);
    });

    test('getAssetLineage success', async () => {
        mock.onGet('http://api.example.com/api/v1/lineage/entities/asset1?upstreamDepth=1&downstreamDepth=1').reply(200, { upstreamEdges: [], downstreamEdges: [] });
        await api.authenticate('valid_token');
        const result = await api.getAssetLineage('asset1');
        expect(result).toHaveProperty('upstreamEdges');
        expect(result).toHaveProperty('downstreamEdges');
    });

    test('searchAssets success', async () => {
        mock.onGet('http://api.example.com/api/v1/search/query?q=test&index=all_entity_search_index&from=0&size=10').reply(200, { hits: { total: { value: 1 }, hits: [{ _source: { name: 'Test Asset' } }] } });
        await api.authenticate('valid_token');
        const result = await api.searchAssets('test');
        expect(result.hits.total.value).toBe(1);
        expect(result.hits.hits[0]._source.name).toBe('Test Asset');
    });

    test('getDataQualityTestResults success', async () => {
        mock.onGet('http://api.example.com/api/v1/dataQuality/testCases/test1/testCaseResults').reply(200, { results: [{ result: 'Success' }] });
        await api.authenticate('valid_token');
        const result = await api.getDataQualityTestResults('test1');
        expect(result.results[0].result).toBe('Success');
    });

    test('getIngestionBotToken success', async () => {
        mock.onGet('http://api.example.com/api/v1/bots/name/ingestion-bot').reply(200, { botToken: { token: 'bot_token' } });
        await api.authenticate('valid_token');
        const result = await api.getIngestionBotToken();
        expect(result).toBe('bot_token');
    });

    test('getIngestionBotToken not authenticated', async () => {
        await expect(api.getIngestionBotToken()).rejects.toThrow('Not authenticated');
    });
});

describe('MockOpenMetadataAPI', () => {
    // ... (keep existing MockOpenMetadataAPI tests)
});