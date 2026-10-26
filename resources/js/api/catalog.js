import apiClient from './client';

/**
 * Fetch paginated catalog list with search, category, and type filters.
 */
export async function fetchCatalog(params = {}) {
    const response = await apiClient.get('/catalog', { params });
    return response.data;
}

/**
 * Fetch detailed product specifications and options by slug.
 */
export async function fetchCatalogDetail(slug) {
    const response = await apiClient.get(`/catalog/${slug}`);
    return response.data;
}
