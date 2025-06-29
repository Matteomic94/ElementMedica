import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

interface AxiosRequestConfig {
  signal?: AbortSignal;
  timeout?: number;
  headers?: Record<string, string>;
  [key: string]: any;
}

interface UseFetchOptions<T> {
  initialData?: T;
  fallbackData?: T;
  timeoutMs?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

function useFetch<T = any>(
  url: string, 
  options?: AxiosRequestConfig, 
  fetchOptions?: UseFetchOptions<T>
) {
  const [data, setData] = useState<T | undefined>(fetchOptions?.initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if we're using fallback data
  const [usingFallback, setUsingFallback] = useState(false);

  // Function to ensure URL has the correct base
  const getFullUrl = (urlPath: string): string => {
    // If already a full URL with protocol, return as is
    if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
      return urlPath;
    }
    
    // If it starts with a slash, append to API_BASE_URL
    if (urlPath.startsWith('/')) {
      return `${API_BASE_URL}${urlPath}`;
    }
    
    // Otherwise, add a slash between API_BASE_URL and the path
    return `${API_BASE_URL}/${urlPath}`;
  };

  const fetchData = async (abortController?: AbortController) => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Create axios config with timeout if specified
      const requestConfig: AxiosRequestConfig = {
        ...options,
        signal: abortController?.signal,
        timeout: fetchOptions?.timeoutMs || 10000
      };
      
      // Use the proper full URL
      const fullUrl = getFullUrl(url);
      console.log(`Fetching from: ${fullUrl}`);
      
      const response = await axios.get<T>(fullUrl, requestConfig);
      
      if (response.status === 200) {
        setData(response.data);
        setUsingFallback(false);
        fetchOptions?.onSuccess?.(response.data);
      } else {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (err: any) {
      console.warn(`Fetch error:`, err);
      
      // Handle fallback data if provided
      if (fetchOptions?.fallbackData !== undefined) {
        console.log(`Using fallback data for ${url}`);
        setData(fetchOptions.fallbackData);
        setUsingFallback(true);
        setError(`Using demo data (${err.message})`);
      } else {
        setError(err.message || 'An error occurred');
      }
      
      fetchOptions?.onError?.(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    
    if (url) {
      fetchData(abortController);
    } else {
      // If URL is empty, reset everything except for fallback data
      if (fetchOptions?.fallbackData !== undefined) {
        setData(fetchOptions.fallbackData);
        setUsingFallback(true);
        setError('Using demo data (no endpoint provided)');
      } else {
        setData(undefined);
        setError(null);
      }
      setLoading(false);
    }
    
    return () => {
      abortController.abort();
    };
  }, [url]);

  const refetch = () => fetchData();

  return { data, loading, error, refetch, usingFallback };
}

export default useFetch;