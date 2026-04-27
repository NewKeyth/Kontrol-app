/**
 * PullToRefreshList - Lista con pull-to-refresh animado
 * 
 * Implementa pull-to-refresh con indicador animado personalizado.
 * Usa el RefreshControl nativo de React Native con estilo Glow/Verde.
 * 
 * @module components/ui/PullToRefreshList
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { AnimatedFlatList } from './AnimatedFlatList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuración de thresholds
const PULL_THRESHOLD = 80; // px para activar refresh
const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
  background: '#0F1711',
  text: '#E0EFE1',
};

/**
 * PullToRefreshList - Lista con pull-to-refresh integrado
 * 
 * @param {Array} data - Datos para la lista
 * @param {Function} renderItem - Función para renderizar items
 * @param {Function} keyExtractor - Función para keys
 * @param {Function} onRefresh - Callback para refresh (async)
 * @param {Function} onRefreshEnd - Callback cuando termina refresh
 * @param {boolean} showPullIndicator - Mostrar indicador de pull
 * @param {string} refreshText - Texto durante refresh
 * @param {Object} listProps - Props adicionales para AnimatedFlatList
 * 
 * @example
 * <PullToRefreshList
 *   data={items}
 *   renderItem={({ item }) => <Text>{item.title}</Text>}
 *   keyExtractor={item => item.id}
 *   onRefresh={fetchNewData}
 * />
 */
export function PullToRefreshList({
  data = [],
  renderItem,
  keyExtractor,
  onRefresh,
  onRefreshEnd,
  showPullIndicator = true,
  refreshText = 'Actualizando...',
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onEndReached,
  onEndReachedThreshold = 0.5,
  staggerDelay = 50,
  animated = true,
  ...listProps
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Manejar pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      // Silently handle refresh errors - user can retry
    } finally {
      setRefreshing(false);
      if (onRefreshEnd) {
        onRefreshEnd();
      }
    }
  }, [onRefresh, onRefreshEnd]);

  // Custom RefreshControl con estilo Glow/Verde
  const refreshControl = (
    <CustomRefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      pullDistance={pullDistance}
      setPullDistance={setPullDistance}
      threshold={PULL_THRESHOLD}
      showIndicator={showPullIndicator}
      refreshText={refreshText}
    />
  );

  return (
    <AnimatedFlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent || (
        <EmptyListMessage />
      )}
      staggerDelay={staggerDelay}
      animated={animated}
      refreshControl={refreshControl}
      {...listProps}
    />
  );
}

/**
 * CustomRefreshControl - Indicador de refresh personalizado
 * 
 * Muestra un spinner animado y texto cuando se está refrescando.
 */
function CustomRefreshControl({
  refreshing,
  onRefresh,
  pullDistance,
  setPullDistance,
  threshold,
  showIndicator,
  refreshText,
}) {
  // Usar RefreshControl nativo
  const ReactNativeRefreshControl = require('react-native').RefreshControl;
  
  return (
    <ReactNativeRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      // Colores según tema Glow/Verde
      tintColor={COLORS.glow}
      colors={[COLORS.glow]}
      // Título personalizado
      title={refreshing ? refreshText : ''}
      titleColor={COLORS.text}
      // Progress view offset
      progressViewOffset={threshold}
    />
  );
}

/**
 * EmptyListMessage - Mensaje cuando la lista está vacía
 */
function EmptyListMessage() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay elementos</Text>
      <Text style={styles.emptySubtext}>Desliza hacia abajo para actualizar</Text>
    </View>
  );
}

/**
 * LoadingFooter - Footer de carga para listas infinitas
 */
export function LoadingFooter({ isLoading }) {
  if (!isLoading) return null;
  
  return (
    <View style={styles.footerContainer}>
      <ActivityIndicator size="small" color={COLORS.glow} />
      <Text style={styles.footerText}>Cargando más...</Text>
    </View>
  );
}

/**
 * RefreshHeader - Header animado que aparece durante pull
 * 
 * @param {number} pullDistance - Distancia actual del pull
 * @param {boolean} isRefreshing - Si está refrescando
 */
export function RefreshHeader({ pullDistance, isRefreshing, threshold = PULL_THRESHOLD }) {
  const progress = Math.min(pullDistance / threshold, 1);
  
  return (
    <View style={styles.headerContainer}>
      {isRefreshing ? (
        <ActivityIndicator size="small" color={COLORS.glow} />
      ) : (
        <View style={styles.headerIndicator}>
          <View style={[styles.headerProgress, { width: `${progress * 100}%` }]} />
        </View>
      )}
    </View>
  );
}

// Configuración exportada
export const PULL_TO_REFRESH_CONFIG = {
  THRESHOLD: PULL_THRESHOLD,
  COLORS,
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    color: COLORS.accent,
    fontSize: 14,
    marginTop: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  footerText: {
    color: COLORS.accent,
    fontSize: 14,
  },
  headerContainer: {
    height: PULL_THRESHOLD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIndicator: {
    width: 100,
    height: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  headerProgress: {
    height: '100%',
    backgroundColor: COLORS.glow,
    borderRadius: 2,
  },
});

export default PullToRefreshList;
