/**
 * useNavigationAnimation - Hook para animaciones de navegación
 * 
 * Hook especializado para crear animaciones de transición
 * entre pantallas con configuraciones de spring predefinidas.
 * 
 * @module hooks/useNavigationAnimation
 */

import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

import {
  SCREEN_SPRING_CONFIGS,
  SCREEN_TIMING_CONFIGS,
  SCREEN_DIMENSIONS,
  getSpringConfig,
  getTimingConfig,
} from '../navigation/ScreenTransition';

/**
 * @typedef {Object} NavigationAnimationOptions
 * @property {string} direction - Dirección: 'horizontal' | 'vertical'
 * @property {string} transitionType - Tipo: 'slide' | 'fade' | 'fadeSlide' | 'scale'
 * @property {string} springPreset - Preset de spring
 * @property {string} timingPreset - Preset de timing
 * @property {boolean} fadeEnabled - Habilitar fade
 * @property {number} slideDistance - Distancia del slide (0-1)
 * @property {Function} onAnimationStart - Callback al iniciar animación
 * @property {Function} onAnimationComplete - Callback al completar animación
 */

/**
 * useNavigationAnimation - Hook para animaciones de navegación
 * 
 * @param {NavigationAnimationOptions} options 
 * 
 * @returns {Object} {
 *   animatedStyle,
 *   progress,
 *   goIn,
 *   goOut,
 *   reset,
 *   isAnimating,
 *   isVisible
 * }
 * 
 * @example
 * // Uso básico con slide horizontal
 * const { animatedStyle, goIn, goOut } = useNavigationAnimation({
 *   direction: 'horizontal',
 *   transitionType: 'slide',
 * });
 * 
 * @example
 * // Uso con callbacks
 * const { animatedStyle, goIn, goOut, isAnimating } = useNavigationAnimation({
 *   direction: 'vertical',
 *   transitionType: 'fadeSlide',
 *   springPreset: 'gentle',
 *   onAnimationComplete: (direction) => console.log(`Animación ${direction} completada`),
 * });
 */
export function useNavigationAnimation(options = {}) {
  const {
    direction = 'horizontal',
    transitionType = 'slide',
    springPreset = 'forward',
    timingPreset = 'standard',
    fadeEnabled = true,
    slideDistance = 1,
    onAnimationStart,
    onAnimationComplete,
  } = options;

  // Shared values para la animación
  const progress = useSharedValue(0);
  const translate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const isAnimating = useSharedValue(false);
  const isVisible = useSharedValue(true);

  // Obtener configuraciones
  const springConfig = getSpringConfig(springPreset);
  const timingConfig = getTimingConfig(timingPreset);
  
  const isHorizontal = direction === 'horizontal';
  const screenDimension = isHorizontal 
    ? SCREEN_DIMENSIONS.width 
    : SCREEN_DIMENSIONS.height;
  const slideDistancePx = screenDimension * slideDistance;

  // Función para notificar inicio de animación
  const notifyStart = useCallback(() => {
    if (onAnimationStart) {
      onAnimationStart();
    }
  }, [onAnimationStart]);

  // Función para notificar final de animación
  const notifyComplete = useCallback((direction) => {
    if (onAnimationComplete) {
      onAnimationComplete(direction);
    }
  }, [onAnimationComplete]);

  /**
   * Animación de entrada (ir a la pantalla)
   */
  const goIn = useCallback((customConfig = {}) => {
    'worklet';
    
    isAnimating.value = true;
    isVisible.value = true;
    
    if (onAnimationStart) {
      runOnJS(notifyStart)();
    }

    const config = { ...springConfig, ...customConfig };

    // Resetear valores
    progress.value = 0;
    
    switch (transitionType) {
      case 'slide':
        // Iniciar desde la posición de entrada
        if (isHorizontal) {
          translate.value = slideDistancePx;
        } else {
          translate.value = slideDistancePx;
        }
        // Animar a posición final
        translate.value = withSpring(0, config);
        break;
        
      case 'fade':
        opacity.value = withTiming(1, timingConfig);
        break;
        
      case 'fadeSlide':
      default:
        // Combinar fade y slide
        if (isHorizontal) {
          translate.value = slideDistancePx;
        } else {
          translate.value = slideDistancePx;
        }
        translate.value = withSpring(0, config);
        
        if (fadeEnabled) {
          opacity.value = withTiming(1, timingConfig);
        }
        break;
        
      case 'scale':
        scale.value = 0.9;
        opacity.value = withTiming(0, timingConfig);
        
        scale.value = withSpring(1, config);
        if (fadeEnabled) {
          opacity.value = withTiming(1, timingConfig);
        }
        break;
    }

    // Completar animación
    progress.value = withSpring(1, config, (finished) => {
      if (finished) {
        isAnimating.value = false;
        runOnJS(notifyComplete)('in');
      }
    });
  }, [transitionType, isHorizontal, slideDistancePx, springConfig, timingConfig, fadeEnabled, isAnimating, isVisible, progress, translate, opacity, scale, notifyStart, notifyComplete]);

  /**
   * Animación de salida (salir de la pantalla)
   */
  const goOut = useCallback((customConfig = {}) => {
    'worklet';
    
    isAnimating.value = true;
    
    if (onAnimationStart) {
      runOnJS(notifyStart)();
    }

    const exitSpringConfig = springPreset === 'forward'
      ? { ...getSpringConfig('backward'), ...customConfig }
      : { ...springConfig, ...customConfig };

    switch (transitionType) {
      case 'slide':
        // Animar hacia fuera
        if (isHorizontal) {
          translate.value = withSpring(-slideDistancePx * 0.3, exitSpringConfig);
        } else {
          translate.value = withSpring(-slideDistancePx * 0.3, exitSpringConfig);
        }
        break;
        
      case 'fade':
        opacity.value = withTiming(0, timingConfig, (finished) => {
          if (finished) {
            isVisible.value = false;
            isAnimating.value = false;
            runOnJS(notifyComplete)('out');
          }
        });
        break;
        
      case 'fadeSlide':
      default:
        // Combinar fade y slide
        if (isHorizontal) {
          translate.value = withSpring(slideDistancePx * 0.3, exitSpringConfig);
        } else {
          translate.value = withSpring(slideDistancePx * 0.3, exitSpringConfig);
        }
        
        if (fadeEnabled) {
          opacity.value = withTiming(0, timingConfig, (finished) => {
            if (finished) {
              isVisible.value = false;
              isAnimating.value = false;
              runOnJS(notifyComplete)('out');
            }
          });
        }
        break;
        
      case 'scale':
        scale.value = withSpring(0.9, exitSpringConfig);
        if (fadeEnabled) {
          opacity.value = withTiming(0, timingConfig, (finished) => {
            if (finished) {
              isVisible.value = false;
              isAnimating.value = false;
              runOnJS(notifyComplete)('out');
            }
          });
        }
        break;
    }

    // Para slide sin fade, completar manualmente
    if (transitionType === 'slide' && !fadeEnabled) {
      progress.value = withTiming(0, timingConfig, (finished) => {
        if (finished) {
          isVisible.value = false;
          isAnimating.value = false;
          runOnJS(notifyComplete)('out');
        }
      });
    }
  }, [transitionType, isHorizontal, slideDistancePx, springPreset, springConfig, timingConfig, fadeEnabled, isAnimating, isVisible, progress, translate, opacity, scale, notifyStart, notifyComplete]);

  /**
   * Resetear valores a estado inicial
   */
  const reset = useCallback(() => {
    'worklet';
    progress.value = 0;
    translate.value = 0;
    scale.value = 1;
    opacity.value = 1;
    isAnimating.value = false;
    isVisible.value = true;
  }, [progress, translate, scale, opacity, isAnimating, isVisible]);

  /**
   * Estilo animado calculado
   */
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    
    const style = {
      transform: [],
      opacity: fadeEnabled ? opacity.value : 1,
    };

    // Agregar transformaciones según el tipo de transición
    if (transitionType === 'slide' || transitionType === 'fadeSlide') {
      if (isHorizontal) {
        style.transform.push({ translateX: translate.value });
      } else {
        style.transform.push({ translateY: translate.value });
      }
    }

    if (transitionType === 'scale') {
      style.transform.push({ scale: scale.value });
    }

    return style;
  });

  return {
    // Estilos
    animatedStyle,
    // Valores animados
    progress,
    translate,
    scale,
    opacity,
    // Estado
    isAnimating,
    isVisible,
    // Funciones
    goIn,
    goOut,
    reset,
    // Configuración
    config: {
      spring: springConfig,
      timing: timingConfig,
    },
  };
}

/**
 * useScreenTransition - Hook simplificado para transiciones de pantalla
 * 
 * Versión más simple que maneja entrada y salida automáticamente
 * basado en la prop visible.
 * 
 * @param {boolean} visible - Controla visibilidad
 * @param {Object} options - Opciones adicionales
 */
export function useScreenTransition(visible, options = {}) {
  const {
    direction = 'horizontal',
    transitionType = 'fadeSlide',
    springPreset = 'forward',
    onAnimationComplete,
  } = options;

  const {
    animatedStyle,
    progress,
    goIn,
    goOut,
    reset,
    isAnimating,
    isVisible,
  } = useNavigationAnimation({
    direction,
    transitionType,
    springPreset,
    onAnimationComplete,
  });

  // Efecto para manejar visibilidad automáticamente
  useEffect(() => {
    if (visible) {
      goIn();
    } else {
      goOut();
    }
  }, [visible]);

  return {
    animatedStyle,
    progress,
    goIn,
    goOut,
    reset,
    isAnimating,
    isVisible,
  };
}

/**
 * useSwipeBack - Hook para gesto de swipe-back
 * 
 * Útil para implementar navegación swipe-back al estilo iOS
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.edgeThreshold - Distancia desde el borde para activar (default: 20)
 * @param {number} options.completeThreshold - Porcentaje de pantalla para completar (default: 0.3)
 * @param {Function} options.onSwipeStart - Callback al iniciar swipe
 * @param {Function} options.onSwipeComplete - Callback al completar swipe
 * @param {Function} options.onSwipeCancel - Callback al cancelar swipe
 */
export function useSwipeBack(options = {}) {
  const {
    edgeThreshold = 20,
    completeThreshold = 0.3,
    onSwipeStart,
    onSwipeComplete,
    onSwipeCancel,
  } = options;

  const translateX = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const startX = useSharedValue(0);

  const screenWidth = SCREEN_DIMENSIONS.width;
  const completeDistance = screenWidth * completeThreshold;

  const onGestureStart = useCallback((x) => {
    'worklet';
    // Solo iniciar si está cerca del borde izquierdo
    if (x < edgeThreshold) {
      isSwiping.value = true;
      startX.value = 0;
      translateX.value = 0;
      
      if (onSwipeStart) {
        runOnJS(onSwipeStart)();
      }
    }
  }, [edgeThreshold, isSwiping, startX, translateX, onSwipeStart]);

  const onGestureUpdate = useCallback((x, absoluteX) => {
    'worklet';
    if (!isSwiping.value) return;
    
    // Solo permitir swipe desde el borde
    if (absoluteX < edgeThreshold * 2) {
      translateX.value = Math.max(0, x - startX.value);
    }
  }, [edgeThreshold, isSwiping, startX, translateX]);

  const onGestureEnd = useCallback((velocityX) => {
    'worklet';
    if (!isSwiping.value) return;
    
    const shouldComplete = translateX.value > completeDistance || velocityX > 500;
    
    if (shouldComplete) {
      // Completar swipe-back
      translateX.value = withSpring(screenWidth, { damping: 20, stiffness: 100 });
      
      if (onSwipeComplete) {
        runOnJS(onSwipeComplete)();
      }
    } else {
      // Cancelar y volver
      translateX.value = withSpring(0, { damping: 20, stiffness: 100 });
      
      if (onSwipeCancel) {
        runOnJS(onSwipeCancel)();
      }
    }
    
    isSwiping.value = false;
  }, [isSwiping, translateX, completeDistance, screenWidth, onSwipeComplete, onSwipeCancel]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return {
    translateX,
    isSwiping,
    animatedStyle,
    onGestureStart,
    onGestureUpdate,
    onGestureEnd,
    // Config
    edgeThreshold,
    completeThreshold,
  };
}

export default useNavigationAnimation;
