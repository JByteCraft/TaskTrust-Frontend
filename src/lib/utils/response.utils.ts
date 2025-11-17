// src/lib/utils/response.utils.ts
/**
 * Standardized response extraction utilities
 * 
 * Backend always returns: { status, response, message }
 * 
 * When using axios directly:
 * - axios.get() returns AxiosResponse
 * - response.data = { status, response, message }
 * - So data is in response.data.response
 * 
 * When using fetch.utils (GET/POST/etc):
 * - fetch.utils returns response.data directly
 * - So data is in response.response
 */

/**
 * Extract data from axios response (when using axios directly)
 * Handles: { status, response, message } structure
 */
export const extractAxiosData = <T = any>(axiosResponse: any): T | null => {
  if (!axiosResponse) return null;
  
  const data = axiosResponse.data || axiosResponse;
  
  // Structure: { status, response, message }
  if (data?.response !== undefined) {
    return data.response as T;
  }
  
  // Fallback: { data, ... }
  if (data?.data !== undefined) {
    return data.data as T;
  }
  
  // Direct data
  if (data && typeof data === 'object' && !data.status && !data.message) {
    return data as T;
  }
  
  return null;
};

/**
 * Extract data from fetch.utils response (when using GET/POST/etc)
 * Handles: { status, response, message } structure
 */
export const extractFetchData = <T = any>(fetchResponse: any): T | null => {
  if (!fetchResponse) return null;
  
  // Structure: { status, response, message }
  if (fetchResponse?.response !== undefined) {
    return fetchResponse.response as T;
  }
  
  // Fallback: { data, ... }
  if (fetchResponse?.data !== undefined) {
    return fetchResponse.data as T;
  }
  
  // Direct data
  if (fetchResponse && typeof fetchResponse === 'object' && !fetchResponse.status && !fetchResponse.message) {
    return fetchResponse as T;
  }
  
  return null;
};

/**
 * Extract array data from axios response
 */
export const extractAxiosArray = <T = any>(axiosResponse: any): T[] => {
  const data = extractAxiosData<any>(axiosResponse);
  return Array.isArray(data) ? data : [];
};

/**
 * Extract array data from fetch.utils response
 */
export const extractFetchArray = <T = any>(fetchResponse: any): T[] => {
  const data = extractFetchData<any>(fetchResponse);
  return Array.isArray(data) ? data : [];
};

