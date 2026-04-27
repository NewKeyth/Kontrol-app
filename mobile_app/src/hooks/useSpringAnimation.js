/**
 * useSpringAnimation - Hook para configuraciones de spring animation
 * 
 * Hook reutilizable que proporciona configuraciones de resorte
 * para animaciones personalizadas en toda la app.
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.damping - Factor de amortiguación (default: 15)
 * @param {number} options.stiffness - Rigidez del resorte (default: 100)
 * @param {number} options.mass - Masa del objeto (default: 1)
 * @param {boolean} options.immediate - Animación inmediata sin spring
 * 
 * @returns {Object} { springConfig, animate, animateTo, getAnimatedValue }
 * 
 * @example
 * // Uso básico
 * const { springConfig, animate } = useSpringAnimation();
 * 
 * // Configuración custom
 * const { springConfig, animate, getAnimatedValue } = useSpringAnimation({
 *   damping: 20,
 *   stiffness: 150,
 *   mass: 0.8,
 * });
 */

import { useCallback, useMemo } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, runOnJS } from 'react-native-reanimated';

// Configuraciones predefinidas de spring
export const SPRING_PRESETS = {
  // Spring suave para transiciones sutiles
  gentle: {
    damping: 20,
    stiffness: 80,
    mass: 1,
  },
  // Spring estándar para interacciones
  standard: {
    damping: 15,
    stiffness: 100,
    mass: 1,
  },
  // Spring rígido para respuestas rápidas
  bouncy: {
    damping: 10,
    stiffness: 150,
    mass: 0.8,
  },
  // Spring muy rígido para botones
  responsive: {
    damping: 15,
    stiffness: 200,
    mass: 0.5,
  },
  // Spring para cargas pesadas
  heavy: {
    damping: 25,
    stiffness: 60,
    mass: 1.5,
  },
};

export function useSpringAnimation(options = {}) {
  const {
    damping = 15,
    stiffness = 100,
    mass = 1,
    immediate = false,
  } = options;

  // Crear shared value
  const animatedValue = useSharedValue(immediate ? 1 : 0);

  // Memoizar configuración del spring
  const springConfig = useMemo(() => ({
    damping,
    stiffness,
    mass,
  }), [damping, stiffness, mass]);

  // Función para animar a un valor específico
  const animate = useCallback((toValue, customConfig = {}) => {
    const config = { ...springConfig, ...customConfig };
    animatedValue.value = withSpring(toValue, config);
  }, [animatedValue, springConfig]);

  // Función para animate con timing
  const animateWithTiming = useCallback((toValue, duration = 300, easing = Easing.inOut(Easing.ease)) => {
    animatedValue.value = withTiming(toValue, { duration, easing });
  }, [animatedValue]);

  // Función para obtener valor animado actual
  const getAnimatedValue = useCallback(() => {
    return animatedValue.value;
  }, [animatedValue]);

  // Estilo animado base
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: animatedValue.value }],
    };
  });

  // Resetear valor
  const reset = useCallback(() => {
    animatedValue.value = immediate ? 1 : 0;
  }, [animatedValue, immediate]);

  return {
    animatedValue,
    animatedStyle,
    springConfig,
    animate,
    animateTo: animate, // Alias
    animateWithTiming,
    getAnimatedValue,
    reset,
  };
}

/**
 * Hook para animaciones de escala con spring
 * Especializado para botones y elementos interactivos
 * 
 * @param {number} pressedScale - Escala cuando está presionado (default: 0.95)
 * @param {number} pressedOpacity - Opacidad cuando está presionado (default: 0.8)
 * @param {string} preset - Preset de spring ('gentle' | 'standard' | 'bouncy' | 'responsive')
 * 
 * @returns {Object} { animatedStyle, scale, opacity, handlePressIn, handlePressOut }
 */
export function useScaleAnimation({
  pressedScale = 0.95,
  pressedOpacity = 0.8,
  preset = 'standard',
} = {}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const config = SPRING_PRESETS[preset] || SPRING_PRESETS.standard;

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(pressedScale, config);
    opacity.value = withSpring(pressedOpacity, config);
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, config);
    opacity.value = withSpring(1, config);
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return {
    animatedStyle,
    scale,
    opacity,
    handlePressIn,
    handlePressOut,
  };
}

/**
 * Hook para animaciones de traslación
 * Útil para slide-in, slide-out, etc.
 * 
 * @param {string} direction - Dirección: 'x' | 'y' | 'xy'
 * @param {number} distance - Distancia de traslación
 * @param {string} preset - Preset de spring
 * 
 * @returns {Object} { animatedStyle, translate, slideIn, slideOut, reset }
 */
export function useTranslateAnimation({
  direction = 'y',
  distance = 20,
  preset = 'standard',
} = {}) {
  const translateX = useSharedValue(direction === 'x' || direction === 'xy' ? distance : 0);
  const translateY = useSharedValue(direction === 'y' || direction === 'xy' ? distance : 0);
  
  const config = SPRING_PRESETS[preset] || SPRING_PRESETS.standard;

  const slideIn = (customDistance = distance) => {
    'worklet';
    if (direction === 'x' || direction === 'xy') {
      translateX.value = withSpring(0, config);
    }
    if (direction === 'y' || direction === 'xy') {
      translateY.value = withSpring(0, config);
    }
  };

  const slideOut = (customDistance = distance) => {
    'worklet';
    if (direction === 'x' || direction === 'xy') {
      translateX.value = withSpring(customDistance, config);
    }
    if (direction === 'y' || direction === 'xy') {
      translateY.value = withSpring(customDistance, config);
    }
  };

  const reset = () => {
    'worklet';
    translateX.value = direction === 'x' || direction === 'xy' ? distance : 0;
    translateY.value = direction === 'y' || direction === 'xy' ? distance : 0;
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  return {
    animatedStyle,
    translateX,
    translateY,
    slideIn,
    slideOut,
    reset,
  };
}

export default useSpringAnimation;
