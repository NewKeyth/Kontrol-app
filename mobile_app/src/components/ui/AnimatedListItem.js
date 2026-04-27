/**
 * AnimatedListItem - Componente de item de lista con animaciones de entrada/salida
 * 
 * Proporciona animaciones de entrada (fade-in + translateY) para items de lista
 * cuando aparecen en pantalla. Diseñado para usar con AnimatedFlatList.
 * 
 * @param {React.Node} children - Contenido del item
 * @param {number} index - Índice del item en la lista (para stagger)
 * @param {boolean} isVisible - Controla si el item debe mostrarse
 * @param {number} entranceDelay - Delay antes de la animación de entrada (default: 0)
 * @param {Object} style - Estilos adicionales
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

// Colores del tema Glow/Verde
const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
  background: '#0F1711',
  border: '#243628',
};

// Configuración de spring para entrada
const ENTRANCE_SPRING_CONFIG = {
  damping: 18,
  stiffness: 120,
  mass: 0.8,
};

// Configuración de spring para salida
const EXIT_SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
};

export function AnimatedListItem({
  children,
  index = 0,
  isVisible = true,
  entranceDelay = 0,
  style,
  onEnterAnimationComplete,
  ...props
}) {
  // Shared values para animaciones
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  // Calcular delay basado en índice (stagger: 50ms entre items)
  const staggerDelay = entranceDelay > 0 ? entranceDelay : index * 50;

  useEffect(() => {
    if (isVisible) {
      // Animación de entrada
      opacity.value = withDelay(
        staggerDelay,
        withSpring(1, ENTRANCE_SPRING_CONFIG)
      );
      translateY.value = withDelay(
        staggerDelay,
        withSpring(0, ENTRANCE_SPRING_CONFIG)
      );
      scale.value = withDelay(
        staggerDelay,
        withSpring(1, ENTRANCE_SPRING_CONFIG)
      );
      
      // Callback cuando termina la animación de entrada
      if (onEnterAnimationComplete) {
        const timeout = setTimeout(() => {
          runOnJS(onEnterAnimationComplete)(index);
        }, staggerDelay + 300);
        return () => clearTimeout(timeout);
      }
    } else {
      // Animación de salida
      opacity.value = withSpring(0, EXIT_SPRING_CONFIG);
      translateY.value = withSpring(20, EXIT_SPRING_CONFIG);
      scale.value = withSpring(0.95, EXIT_SPRING_CONFIG);
    }
  }, [isVisible, index, staggerDelay, opacity, translateY, scale, onEnterAnimationComplete]);

  // Estilos animados
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

  return (
    <Animated.View 
      style={[styles.container, animatedStyle, style]} 
      {...props}
    >
      {children}
    </Animated.View>
  );
}

// Variante con borde para separar items
export function AnimatedListItemWithBorder({
  children,
  index = 0,
  isVisible = true,
  showBorder = true,
  ...props
}) {
  return (
    <AnimatedListItem
      index={index}
      isVisible={isVisible}
      style={showBorder ? styles.withBorder : null}
      {...props}
    >
      {children}
    </AnimatedListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  withBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderRadius: 0,
    marginBottom: 0,
  },
});

export default AnimatedListItem;
