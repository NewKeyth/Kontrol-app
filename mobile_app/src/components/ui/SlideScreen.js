/**
 * SlideScreen - Componente wrapper con animación de slide
 * 
 * Componente que envuelve una pantalla y proporciona
 * animación de entrada/salida con efecto slide.
 * 
 * @module components/ui/SlideScreen
 */

import React, { useEffect, useCallback } from 'react';
import { StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { SCREEN_SPRING_CONFIGS, SCREEN_TIMING_CONFIGS, SCREEN_DIMENSIONS } from '../../navigation/ScreenTransition';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = SCREEN_DIMENSIONS;

/**
 * @typedef {Object} SlideScreenProps
 * @property {React.ReactNode} children - Contenido de la pantalla
 * @property {boolean} visible - Controla si la pantalla está visible
 * @property {boolean} unmountOnHide - Desmonta el children cuando no está visible
 * @property {string} direction - Dirección del slide: 'left' | 'right' | 'up' | 'down'
 * @property {string} animationType - Tipo de animación: 'spring' | 'timing'
 * @property {string} springPreset - Preset de spring: 'forward' | 'backward' | 'gentle' | 'fast' | 'bouncy'
 * @property {number} slideDistance - Distancia del slide (default: 1 = pantalla completa)
 * @property {Function} onAnimationComplete - Callback cuando termina la animación
 * @property {ViewStyle} style - Estilos adicionales
 * @property {boolean} fadeWithSlide - Agregar efecto fade junto con slide
 */

/**
 * SlideScreen - Componente para pantallas con transición de slide
 * 
 * @param {SlideScreenProps} props 
 * 
 * @example
 * // Slide desde la derecha
 * <SlideScreen visible={isVisible} direction="right">
 *   <MyScreenContent />
 * </SlideScreen>
 * 
 * @example
 * // Slide desde abajo con spring
 * <SlideScreen 
 *   visible={isVisible} 
 *   direction="up" 
 *   animationType="spring"
 *   springPreset="gentle"
 * >
 *   <MyScreenContent />
 * </SlideScreen>
 */
export function SlideScreen({
  children,
  visible = true,
  unmountOnHide = true,
  direction = 'right',
  animationType = 'spring',
  springPreset = 'forward',
  slideDistance = 1,
  onAnimationComplete,
  style,
  fadeWithSlide = true,
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(visible ? 1 : 0);

  const getDistance = useCallback(() => {
    const isHorizontal = direction === 'left' || direction === 'right';
    return (isHorizontal ? SCREEN_WIDTH : SCREEN_HEIGHT) * slideDistance;
  }, [direction, slideDistance]);

  useEffect(() => {
    const distance = getDistance();
    const springConfig = SCREEN_SPRING_CONFIGS[springPreset] || SCREEN_SPRING_CONFIGS.forward;
    const timingConfig = SCREEN_TIMING_CONFIGS.standard;

    if (visible) {
      if (animationType === 'spring') {
        switch (direction) {
          case 'left':
            translateX.value = -distance;
            translateX.value = withSpring(0, springConfig);
            break;
          case 'right':
            translateX.value = distance;
            translateX.value = withSpring(0, springConfig);
            break;
          case 'up':
            translateY.value = -distance;
            translateY.value = withSpring(0, springConfig);
            break;
          case 'down':
            translateY.value = distance;
            translateY.value = withSpring(0, springConfig);
            break;
        }
      } else {
        // Timing animation
        translateX.value = withTiming(0, timingConfig);
        translateY.value = withTiming(0, timingConfig);
      }
      
      if (fadeWithSlide) {
        opacity.value = withTiming(1, timingConfig);
      }
    } else {
      const exitConfig = springPreset === 'forward' 
        ? SCREEN_SPRING_CONFIGS.backward 
        : springConfig;

      if (animationType === 'spring') {
        switch (direction) {
          case 'left':
            translateX.value = withSpring(-distance * 0.3, exitConfig);
            break;
          case 'right':
            translateX.value = withSpring(distance * 0.3, exitConfig);
            break;
          case 'up':
            translateY.value = withSpring(-distance * 0.3, exitConfig);
            break;
          case 'down':
            translateY.value = withSpring(distance * 0.3, exitConfig);
            break;
        }
      } else {
        translateX.value = withTiming(direction === 'left' ? -distance : distance, timingConfig);
        translateY.value = withTiming(direction === 'up' ? -distance : distance, timingConfig);
      }

      if (fadeWithSlide) {
        opacity.value = withTiming(0, timingConfig, (finished) => {
          if (finished && onAnimationComplete) {
            runOnJS(onAnimationComplete)('out');
          }
        });
      } else if (onAnimationComplete) {
        // Call immediately if no fade
        setTimeout(() => runOnJS(onAnimationComplete)('out'), timingConfig.duration);
      }
    }
  }, [visible, animationType, springPreset, fadeWithSlide, getDistance]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const style = {
      transform: [],
      opacity: fadeWithSlide ? opacity.value : 1,
    };

    if (direction === 'left' || direction === 'right') {
      style.transform.push({ translateX: translateX.value });
    } else {
      style.transform.push({ translateY: translateY.value });
    }

    return style;
  });

  // Si no está visible y unmountOnHide es true, no renderizar
  if (!visible && unmountOnHide) {
    return null;
  }

  return (
    <Animated.View 
      style={[styles.container, style, animatedStyle]}
      {...(direction === 'out' ? { pointerEvents: visible ? 'auto' : 'none' } : {})}
    >
      {children}
    </Animated.View>
  );
}

/**
 * SlideScreenWithState - Versión con estado interno de visibilidad
 * 
 * Útil cuando necesitas controlar la animación manualmente
 */
export function SlideScreenWithState({
  children,
  direction = 'right',
  animationType = 'spring',
  springPreset = 'forward',
  slideDistance = 1,
  onAnimationComplete,
  style,
  fadeWithSlide = true,
}) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const show = useCallback(() => {
    if (isAnimating) return;
    setIsVisible(true);
  }, [isAnimating]);

  const hide = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
  }, [isAnimating]);

  const handleAnimationComplete = useCallback((dir) => {
    setIsAnimating(false);
    if (dir === 'out') {
      setIsVisible(false);
    }
    if (onAnimationComplete) {
      onAnimationComplete(dir);
    }
  }, [onAnimationComplete]);

  return (
    <SlideScreen
      visible={isVisible}
      direction={direction}
      animationType={animationType}
      springPreset={springPreset}
      slideDistance={slideDistance}
      onAnimationComplete={handleAnimationComplete}
      style={style}
      fadeWithSlide={fadeWithSlide}
    >
      {typeof children === 'function' 
        ? children({ show, hide, isVisible, isAnimating })
        : React.cloneElement(children, { show, hide, isVisible, isAnimating })
      }
    </SlideScreen>
  );
}

/**
 * SlideScreenModal - Versión especial para modales
 * 
 * Slide desde abajo como un modal
 */
export function SlideScreenModal({
  children,
  visible,
  onClose,
  style,
  ...props
}) {
  return (
    <SlideScreen
      visible={visible}
      direction="down"
      animationType="spring"
      springPreset="gentle"
      fadeWithSlide={true}
      style={[styles.modalOverlay, style]}
      {...props}
    >
      {children}
    </SlideScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default SlideScreen;
