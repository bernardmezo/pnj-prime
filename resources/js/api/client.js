import axios from 'axios';

/**
 * PNJ PRIME v1 REST API Client
 * Configured for same-origin requests with CSRF cookie handling.
 */
const apiClient = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export default apiClient;
