/**
 * Transition Helpers - Utilidades para transiciones de elementos compartidos
 * 
 * Helpers para crear transiciones fluidas entre elementos de diferentes pantallas.
 * Útil para shared element transitions donde un elemento visual
 * se mueve de una pantalla a otra.
 * 
 * @module navigation/transitionHelpers
 */

import { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing, interpolate, Extrapolate } from 'react-native-reanimated';
import { SCREEN_SPRING_CONFIGS, SCREEN_TIMING_CONFIGS } from './ScreenTransition';

// ============================================================================
// SHARED ELEMENT CONTEXT - Contexto para elementos compartidos
// ============================================================================

/**
 * Hook para crear un elemento compartido que puede animarse
 * entre pantallas
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.initialScale - Escala inicial (default: 1)
 * @param {number} options.initialOpacity - Opacidad inicial (default: 1)
 * @param {string} options.springPreset - Preset de spring (default: 'forward')
 * 
 * @returns {Object} { scale, opacity, translateX, translateY, animatedStyle, animateIn, animateOut, reset }
 */
export function useSharedElement(options = {}) {
  const {
    initialScale = 1,
    initialOpacity = 1,
    springPreset = 'forward',
  } = options;

  const scale = useSharedValue(initialScale);
  const opacity = useSharedValue(initialOpacity);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const config = SCREEN_SPRING_CONFIGS[springPreset] || SCREEN_SPRING_CONFIGS.forward;

  const animateIn = (customConfig = {}) => {
    'worklet';
    const finalConfig = { ...config, ...customConfig };
    scale.value = withSpring(1, finalConfig);
    opacity.value = withSpring(1, finalConfig);
    translateX.value = withSpring(0, finalConfig);
    translateY.value = withSpring(0, finalConfig);
  };

  const animateOut = (toScale = 0.8, toOpacity = 0, customConfig = {}) => {
    'worklet';
    const finalConfig = { ...config, ...customConfig };
    scale.value = withSpring(toScale, finalConfig);
    opacity.value = withSpring(toOpacity, finalConfig);
  };

  const animateToPosition = (toX, toY, customConfig = {}) => {
    'worklet';
    const finalConfig = { ...config, ...customConfig };
    translateX.value = withSpring(toX, finalConfig);
    translateY.value = withSpring(toY, finalConfig);
  };

  const reset = () => {
    'worklet';
    scale.value = initialScale;
    opacity.value = initialOpacity;
    translateX.value = 0;
    translateY.value = 0;
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  return {
    scale,
    opacity,
    translateX,
    translateY,
    animatedStyle,
    animateIn,
    animateOut,
    animateToPosition,
    reset,
  };
}

// ============================================================================
// CROSSFADE HELPER - Ayuda para crossfade entre elementos
// ============================================================================

/**
 * Hook para crear una animación de crossfade entre dos elementos
 * 
 * @param {number} duration - Duración de la transición (default: 300)
 * 
 * @returns {Object} { progress, fadeIn, fadeOut, animatedStyle }
 */
export function useCrossfade(duration = 300) {
  const progress = useSharedValue(0);

  const fadeIn = () => {
    'worklet';
    progress.value = withTiming(1, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const fadeOut = () => {
    'worklet';
    progress.value = withTiming(0, {
      duration,
      easing: Easing.inOut(Easing.cubic),
    });
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: progress.value,
    };
  });

  return {
    progress,
    fadeIn,
    fadeOut,
    animatedStyle,
  };
}

// ============================================================================
// STACK TRANSITION HELPER - Ayuda para transiciones de stack
// ============================================================================

/**
 * Hook para animaciones de navegación tipo stack
 * 
 * @param {Object} options - Opciones de configuración
 * @param {string} options.direction - Dirección: 'horizontal' | 'vertical'
 * @param {string} options.springPreset - Preset de spring
 * 
 * @returns {Object} { translate, animatedStyle, push, pop, reset }
 */
export function useStackTransition(options = {}) {
  const {
    direction = 'horizontal',
    springPreset = 'forward',
  } = options;

  const translate = useSharedValue(0);
  const config = SCREEN_SPRING_CONFIGS[springPreset] || SCREEN_SPRING_CONFIGS.forward;

  const isHorizontal = direction === 'horizontal';

  const push = (distance = 1) => {
    'worklet';
    const screenValue = isHorizontal 
      ? require('./ScreenTransition').SCREEN_DIMENSIONS.width
      : require('./ScreenTransition').SCREEN_DIMENSIONS.height;
    
    translate.value = withSpring(screenValue * distance, config);
  };

  const pop = () => {
    'worklet';
    translate.value = withSpring(0, config);
  };

  const reset = () => {
    'worklet';
    translate.value = 0;
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { [isHorizontal ? 'translateX' : 'translateY']: translate.value },
      ],
    };
  });

  return {
    translate,
    animatedStyle,
    push,
    pop,
    reset,
  };
}

// ============================================================================
// MODAL TRANSITION HELPER - Ayuda para transiciones de modal
// ============================================================================

/**
 * Hook para animaciones de modal (slide up/down)
 * 
 * @param {Object} options - Opciones de configuración
 * @param {string} options.springPreset - Preset de spring
 * 
 * @returns {Object} { translateY, opacity, animatedStyle, open, close, reset }
 */
export function useModalTransition(options = {}) {
  const { springPreset = 'gentle' } = options;

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  const config = SCREEN_SPRING_CONFIGS[springPreset] || SCREEN_SPRING_CONFIGS.gentle;
  const timingConfig = SCREEN_TIMING_CONFIGS.standard;

  const open = (screenHeight = require('./ScreenTransition').SCREEN_DIMENSIONS.height) => {
    'worklet';
    translateY.value = withSpring(0, config);
    opacity.value = withTiming(1, timingConfig);
  };

  const close = (screenHeight = require('./ScreenTransition').SCREEN_DIMENSIONS.height) => {
    'worklet';
    translateY.value = withSpring(screenHeight, config);
    opacity.value = withTiming(0, timingConfig);
  };

  const reset = () => {
    'worklet';
    translateY.value = 0;
    opacity.value = 0;
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    };
  });

  return {
    translateY,
    opacity,
    animatedStyle,
    open,
    close,
    reset,
  };
}

// ============================================================================
// ANIMATED VIEW WRAPPER - Wrapper para vistas animadas
// ============================================================================

/**
 * Crea un estilo animado básico para transiciones
 * @param {import('react-native-reanimated').SharedValue} value 
 * @param {Object} fromValues - Valores iniciales
 * @param {Object} toValues - Valores finales
 */
export function createTransitionStyle(value, fromValues = {}, toValues = {}) {
  return useAnimatedStyle(() => {
    'worklet';
    const progress = value.value;
    
    const style = {};
    
    // Interpolate each property
    if (fromValues.opacity !== undefined && toValues.opacity !== undefined) {
      style.opacity = interpolate(
        progress,
        [0, 1],
        [fromValues.opacity, toValues.opacity],
        Extrapolate.CLAMP
      );
    }
    
    if (fromValues.scale !== undefined && toValues.scale !== undefined) {
      style.transform = style.transform || [];
      style.transform.push({
        scale: interpolate(
          progress,
          [0, 1],
          [fromValues.scale, toValues.scale],
          Extrapolate.CLAMP
        ),
      });
    }
    
    if (fromValues.translateX !== undefined && toValues.translateX !== undefined) {
      style.transform = style.transform || [];
      style.transform.push({
        translateX: interpolate(
          progress,
          [0, 1],
          [fromValues.translateX, toValues.translateX],
          Extrapolate.CLAMP
        ),
      });
    }
    
    if (fromValues.translateY !== undefined && toValues.translateY !== undefined) {
      style.transform = style.transform || [];
      style.transform.push({
        translateY: interpolate(
          progress,
          [0, 1],
          [fromValues.translateY, toValues.translateY],
          Extrapolate.CLAMP
        ),
      });
    }

    return style;
  });
}

// ============================================================================
// REUSABLE ANIMATION FUNCTIONS
// ============================================================================

/**
 * Animación de entrada estándar
 * @param {import('react-native-reanimated').SharedValue} value 
 * @param {Object} config 
 */
export function standardEnterAnimation(value, config = {}) {
  'worklet';
  const springConfig = { ...SCREEN_SPRING_CONFIGS.forward, ...config };
  value.value = withSpring(1, springConfig);
}

/**
 * Animación de salida estándar
 * @param {import('react-native-reanimated').SharedValue} value 
 * @param {Object} config 
 */
export function standardExitAnimation(value, config = {}) {
  'worklet';
  const springConfig = { ...SCREEN_SPRING_CONFIGS.backward, ...config };
  value.value = withSpring(0, springConfig);
}

/**
 * Animación de entrada con timing
 * @param {import('react-native-reanimated').SharedValue} value 
 * @param {number} duration 
 * @param {Object} config 
 */
export function timingEnterAnimation(value, duration = 300, config = {}) {
  'worklet';
  const timingConfig = { ...SCREEN_TIMING_CONFIGS.standard, ...config, duration };
  value.value = withTiming(1, timingConfig);
}

/**
 * Animación de salida con timing
 * @param {import('react-native-reanimated').SharedValue} value 
 * @param {number} duration 
 * @param {Object} config 
 */
export function timingExitAnimation(value, duration = 300, config = {}) {
  'worklet';
  const timingConfig = { ...SCREEN_TIMING_CONFIGS.standard, ...config, duration };
  value.value = withTiming(0, timingConfig);
}

export default {
  useSharedElement,
  useCrossfade,
  useStackTransition,
  useModalTransition,
  createTransitionStyle,
  standardEnterAnimation,
  standardExitAnimation,
  timingEnterAnimation,
  timingExitAnimation,
};
