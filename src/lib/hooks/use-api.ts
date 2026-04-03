'use client';

import * as React from 'react';
import { api, APIError } from '@/lib/api/client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  path: string,
  options?: {
    autoFetch?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: APIError) => void;
  }
) {
  const [state, setState] = React.useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.get<T>(path);
      setState({ data, loading: false, error: null });
      options?.onSuccess?.(data);
    } catch (e) {
      const error = e as APIError;
      setState({ data: null, loading: false, error: error.message });
      options?.onError?.(error);
    }
  }, [path, options]);

  React.useEffect(() => {
    if (options?.autoFetch) {
      fetchData();
    }
  }, [fetchData, options?.autoFetch]);

  return {
    ...state,
    refetch: fetchData,
  };
}
