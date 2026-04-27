/**
 * useLoading - Hook para gestión de estados de carga
 * 
 * Proporciona una forma sencilla de manejar estados de carga
 * con soporte para múltiples cargas simultáneas.
 * 
 * @returns {Object} - Estado y métodos para gestionar carga
 * 
 * @usage
 * const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
 * 
 * // Opción 1: Manual
 * startLoading();
 * await fetchData();
 * stopLoading();
 * 
 * // Opción 2: Automatically
 * await withLoading(fetchData());
 */

import { useState, useCallback } from 'react';

export function useLoading(initialState = false) {
  const [loadingCount, setLoadingCount] = useState(0);
  
  // Estado booleano simple (para compatibilidad)
  const isLoading = loadingCount > 0;

  // Incrementar contador de cargas
  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  // Decrementar contador de cargas
  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Resetear a cero
  const resetLoading = useCallback(() => {
    setLoadingCount(0);
  }, []);

  // Ejecutar función con manejo automático de loading
  const withLoading = useCallback(async (promise) => {
    startLoading();
    try {
      const result = await promise;
      return result;
    } catch (error) {
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  // Versión con callback
  const withLoadingCallback = useCallback(async (callback) => {
    startLoading();
    try {
      const result = await callback();
      return result;
    } catch (error) {
      throw error;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    // Estado
    isLoading,
    loadingCount,
    
    // Métodos
    startLoading,
    stopLoading,
    resetLoading,
    withLoading,
    withLoadingCallback,
    
    // Utilidades
    setLoading: startLoading,
    clearLoading: stopLoading,
  };
}

// Hook para múltiples estados de carga
export function useMultipleLoading(keys = []) {
  const [loadingStates, setLoadingStates] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const isLoading = Object.values(loadingStates).some(Boolean);

  const startLoading = useCallback((key) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
  }, []);

  const stopLoading = useCallback((key) => {
    setLoadingStates((prev) => ({ ...prev, [key]: false }));
  }, []);

  const isKeyLoading = useCallback((key) => loadingStates[key] ?? false, [loadingStates]);

  const withLoading = useCallback(async (key, promise) => {
    startLoading(key);
    try {
      const result = await promise;
      return result;
    } catch (error) {
      throw error;
    } finally {
      stopLoading(key);
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingStates,
    startLoading,
    stopLoading,
    isKeyLoading,
    withLoading,
  };
}

// Hook para datos con estado de carga
export function useLoadingData(initialData = null) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const loading = useLoading();

  const loadData = useCallback(async (fetchFn) => {
    setError(null);
    try {
      const result = await loading.withLoading(fetchFn());
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [loading]);

  const refresh = useCallback(async () => {
    if (data) {
      return loadData(() => data);
    }
  }, [data, loadData]);

  return {
    data,
    error,
    isLoading: loading.isLoading,
    loadData,
    refresh,
    setData,
  };
}

export default useLoading;
