/**
 * AnimatedFlatList - Componente FlatList con animaciones integradas
 * 
 * FlatList que automáticamente aplica animaciones de entrada staggered
 * a sus items. Combina FlatList de React Native con las animaciones
 * de AnimatedListItem y useListAnimation.
 * 
 * @param {Array} data - Datos para la lista
 * @param {Function} renderItem - Función para renderizar cada item
 * @param {Function} keyExtractor - Función para extraer keys
 * @param {number} staggerDelay - Delay entre items en ms (default: 50)
 * @param {boolean} animated - Habilitar/deshabilitar animaciones
 * @param {Function} onRefresh - Callback para pull-to-refresh
 * @param {boolean} refreshing - Estado de refresh
 * @param {Function} onEndReached - Callback para scroll infinito
 * @param {Object} flatListProps - Props adicionales para FlatList
 * 
 * @example
 * <AnimatedFlatList
 *   data={items}
 *   renderItem={({ item, index }) => (
 *     <AnimatedListItem index={index}>
 *       <Text>{item.title}</Text>
 *     </AnimatedListItem>
 *   )}
 *   keyExtractor={item => item.id}
 *   staggerDelay={50}
 * />
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { FlatList, View, StyleSheet, RefreshControl } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useListAnimation, ITEM_STATES } from '../../hooks/useListAnimation';

// Colores del tema Glow/Verde
const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
  background: '#0F1711',
};

// Configuración de spring
const ENTRANCE_SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
  mass: 0.8,
};

// Componente interno para item animado
const AnimatedFlatListItem = React.memo(function AnimatedFlatListItem({
  item,
  index,
  renderItem,
  isVisible,
  staggerDelay,
  onEnterAnimationComplete,
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (isVisible) {
      const delay = index * staggerDelay;
      
      opacity.value = withDelay(delay, withSpring(1, ENTRANCE_SPRING_CONFIG));
      translateY.value = withDelay(delay, withSpring(0, ENTRANCE_SPRING_CONFIG));
      scale.value = withDelay(delay, withSpring(1, ENTRANCE_SPRING_CONFIG));

      if (onEnterAnimationComplete) {
        const timeout = setTimeout(() => {
          runOnJS(onEnterAnimationComplete)(index);
        }, delay + 300);
        return () => clearTimeout(timeout);
      }
    } else {
      opacity.value = withSpring(0, ENTRANCE_SPRING_CONFIG);
      translateY.value = withSpring(20, ENTRANCE_SPRING_CONFIG);
      scale.value = withSpring(0.95, ENTRANCE_SPRING_CONFIG);
    }
  }, [isVisible, index, staggerDelay, opacity, translateY, scale, onEnterAnimationComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Si el renderItem ya maneja animaciones, usar sin wrapper
  const RenderedItem = renderItem({ item, index });
  
  // Verificar si el item ya es un AnimatedListItem
  const isAnimatedListItem = RenderedItem?.type?.displayName === 'AnimatedListItem' ||
                            RenderedItem?.type?.name === 'AnimatedListItem';

  if (isAnimatedListItem) {
    return RenderedItem;
  }

  return (
    <Animated.View style={animatedStyle}>
      {RenderedItem}
    </Animated.View>
  );
});

export function AnimatedFlatList({
  data = [],
  renderItem,
  keyExtractor,
  staggerDelay = 50,
  animated = true,
  onRefresh,
  refreshing,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  initialNumToRender = 10,
  maxToRenderPerBatch = 10,
  windowSize = 10,
  removeClippedSubviews = true,
  onEnterAnimationComplete,
  // FlatList props
  ...flatListProps
}) {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const listKey = useRef(0);
  const prevDataLength = useRef(data.length);

  // Usar el hook de animación
  const { itemStates, triggerAnimation, resetAnimation } = useListAnimation({
    itemCount: data.length,
    staggerDelay,
    animate: animated,
  });

  // Trigger animation cuando los datos cambian
  useEffect(() => {
    if (data.length > 0 && data.length !== prevDataLength.current) {
      prevDataLength.current = data.length;
      listKey.current += 1;
      
      // Reset y trigger nueva animación
      resetAnimation();
      
      const timeout = setTimeout(() => {
        setIsDataLoaded(true);
        triggerAnimation();
      }, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [data.length, resetAnimation, triggerAnimation]);

  // Callback cuando un item termina de animarse
  const handleItemEnterComplete = useCallback((index) => {
    if (onEnterAnimationComplete) {
      onEnterAnimationComplete(index);
    }
  }, [onEnterAnimationComplete]);

  // Render item con animación
  const renderAnimatedItem = useCallback(({ item, index }) => {
    if (!animated) {
      return renderItem({ item, index });
    }

    const isVisible = itemStates[index] === ITEM_STATES.VISIBLE;
    
    return (
      <AnimatedFlatListItem
        item={item}
        index={index}
        renderItem={renderItem}
        isVisible={isVisible}
        staggerDelay={staggerDelay}
        onEnterAnimationComplete={handleItemEnterComplete}
      />
    );
  }, [animated, renderItem, itemStates, staggerDelay, handleItemEnterComplete]);

  // Key extractor por defecto
  const defaultKeyExtractor = useCallback((item, index) => {
    return keyExtractor ? keyExtractor(item, index) : String(item.id || index);
  }, [keyExtractor]);

  // Separator
  const renderSeparator = useCallback(() => {
    if (ItemSeparatorComponent) {
      return <ItemSeparatorComponent />;
    }
    return <View style={styles.separator} />;
  }, [ItemSeparatorComponent]);

  // Pull-to-refresh
  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing || false}
      onRefresh={onRefresh}
      tintColor={COLORS.glow}
      colors={[COLORS.glow]}
    />
  ) : undefined;

  return (
    <FlatList
      data={data}
      renderItem={renderAnimatedItem}
      keyExtractor={defaultKeyExtractor}
      ItemSeparatorComponent={renderSeparator}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={refreshControl}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={maxToRenderPerBatch}
      windowSize={windowSize}
      removeClippedSubviews={removeClippedSubviews}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      {...flatListProps}
    />
  );
}

// Variante con datos asíncronos (Skeleton loading)
export function AnimatedFlatListWithLoading({
  data,
  isLoading,
  renderItem,
  renderLoadingItem,
  keyExtractor,
  staggerDelay = 50,
  skeletonCount = 5,
  onRefresh,
  refreshing,
  onEndReached,
  ...props
}) {
  // Mientras carga, mostrar skeletons
  if (isLoading) {
    return (
      <FlatList
        data={Array.from({ length: skeletonCount })}
        renderItem={renderLoadingItem}
        keyExtractor={(_, index) => `skeleton-${index}`}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  // Datos cargados, mostrar con animación
  return (
    <AnimatedFlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      staggerDelay={staggerDelay}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 8,
  },
});

export default AnimatedFlatList;
