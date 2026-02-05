/**
 * Custom Data Provider for React Admin
 *
 * Connects React Admin to our Next.js API routes.
 */

import { DataProvider, fetchUtils } from 'react-admin';

const apiUrl = '/api/admin';

const httpClient = (url: string, options: fetchUtils.Options = {}) => {
  const customHeaders = (options.headers ||
    new Headers({
      Accept: 'application/json',
    })) as Headers;

  // Include credentials to send session cookies with requests
  return fetchUtils.fetchJson(url, { 
    ...options, 
    headers: customHeaders,
    credentials: 'include',
  });
};

/**
 * Data Provider implementation
 */
export const dataProvider: DataProvider = {
  // Get a list of records
  getList: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = 'id', order = 'ASC' } = params.sort || {};
    const filter = params.filter || {};

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sortField: field,
      sortOrder: order,
      filter: JSON.stringify(filter),
    });

    const url = `${apiUrl}/${resource}?${query}`;
    const { json } = await httpClient(url);

    return {
      data: json.data,
      total: json.total,
    };
  },

  // Get a single record by ID
  getOne: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { json } = await httpClient(url);

    return { data: json };
  },

  // Get multiple records by IDs
  getMany: async (resource, params) => {
    const query = new URLSearchParams({
      ids: JSON.stringify(params.ids),
    });

    const url = `${apiUrl}/${resource}?${query}`;
    const { json } = await httpClient(url);

    return { data: json.data };
  },

  // Get related records
  getManyReference: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = 'id', order = 'ASC' } = params.sort || {};

    const query = new URLSearchParams({
      page: String(page),
      perPage: String(perPage),
      sortField: field,
      sortOrder: order,
      filter: JSON.stringify({
        ...params.filter,
        [params.target]: params.id,
      }),
    });

    const url = `${apiUrl}/${resource}?${query}`;
    const { json } = await httpClient(url);

    return {
      data: json.data,
      total: json.total,
    };
  },

  // Create a new record
  create: async (resource, params) => {
    const url = `${apiUrl}/${resource}`;
    const { json } = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });

    return { data: json };
  },

  // Update an existing record
  update: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { json } = await httpClient(url, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    });

    return { data: json };
  },

  // Update multiple records
  updateMany: async (resource, params) => {
    const url = `${apiUrl}/${resource}`;
    const { json } = await httpClient(url, {
      method: 'PUT',
      body: JSON.stringify({
        ids: params.ids,
        data: params.data,
      }),
    });

    return { data: json.ids };
  },

  // Delete a record
  delete: async (resource, params) => {
    const url = `${apiUrl}/${resource}/${params.id}`;
    const { json } = await httpClient(url, {
      method: 'DELETE',
    });

    return { data: json };
  },

  // Delete multiple records
  deleteMany: async (resource, params) => {
    const url = `${apiUrl}/${resource}`;
    const { json } = await httpClient(url, {
      method: 'DELETE',
      body: JSON.stringify({ ids: params.ids }),
    });

    return { data: json.ids };
  },
};
