/**
 * LoadingContext - Contexto global para estados de carga
 * 
 * Proveedor de contexto que permite gestionar estados de carga
 * desde cualquier parte de la aplicación.
 * 
 * @usage
 * import { LoadingProvider, useLoadingContext } from './LoadingContext';
 * 
 * // En App.js
 * <LoadingProvider>
 *   <App />
 * </LoadingProvider>
 * 
 * // En cualquier componente
 * const { isGlobalLoading, showLoading, hideLoading } = useLoadingContext();
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FullScreenSpinner } from '../components/ui/AnimatedSpinner';

// Crear el contexto
const LoadingContext = createContext(undefined);

// Provider component
export function LoadingProvider({ children }) {
  const [loadingCount, setLoadingCount] = useState(0);
  const [message, setMessage] = useState('');

  const isGlobalLoading = loadingCount > 0;

  const showLoading = useCallback((customMessage = '') => {
    setMessage(customMessage);
    setLoadingCount((prev) => prev + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
    if (loadingCount <= 1) {
      setMessage('');
    }
  }, [loadingCount]);

  const clearLoading = useCallback(() => {
    setLoadingCount(0);
    setMessage('');
  }, []);

  const value = {
    isGlobalLoading,
    loadingCount,
    message,
    showLoading,
    hideLoading,
    clearLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isGlobalLoading && <FullScreenSpinnerOverlay message={message} />}
    </LoadingContext.Provider>
  );
}

// Overlay con spinner
function FullScreenSpinnerOverlay({ message }) {
  const { View, Text, StyleSheet } = require('react-native');
  const { SpinnerWithText } = require('../components/ui/AnimatedSpinner');
  
  return (
    <View style={styles.overlay}>
      <View style={styles.spinnerContainer}>
        <SpinnerWithText text={message} />
      </View>
    </View>
  );
}

// Hook para usar el contexto
export function useLoadingContext() {
  const context = useContext(LoadingContext);
  
  if (context === undefined) {
    // Proporcionar valores por defecto si no hay provider
    return {
      isGlobalLoading: false,
      loadingCount: 0,
      message: '',
      showLoading: () => console.warn('LoadingContext not initialized'),
      hideLoading: () => console.warn('LoadingContext not initialized'),
      clearLoading: () => console.warn('LoadingContext not initialized'),
    };
  }
  
  return context;
}

// Hook de alto orden para envolver funciones con loading global
export function withLoadingGlobal(showLoading, hideLoading) {
  return async (fn, message = 'Cargando...') => {
    showLoading(message);
    try {
      const result = await fn();
      return result;
    } catch (error) {
      throw error;
    } finally {
      hideLoading();
    }
  };
}

// Componente para mostrar loading en cualquier parte
export function GlobalLoadingIndicator() {
  const { isGlobalLoading, message } = useLoadingContext();
  
  if (!isGlobalLoading) return null;
  
  return (
    <FullScreenSpinnerOverlay message={message} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 17, 0.9)', // background con opacidad
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  spinnerContainer: {
    backgroundColor: '#1A261D',
    padding: 32,
    borderRadius: 16,
  },
});

export default LoadingContext;
