/**
 * FadeScreen - Componente wrapper con animación de fade
 * 
 * Componente que envuelve una pantalla y proporciona
 * animación de entrada/salida con efecto fade.
 * 
 * @module components/ui/FadeScreen
 */

import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { SCREEN_TIMING_CONFIGS } from '../../navigation/ScreenTransition';

/**
 * @typedef {Object} FadeScreenProps
 * @property {React.ReactNode} children - Contenido de la pantalla
 * @property {boolean} visible - Controla si la pantalla está visible
 * @property {boolean} unmountOnHide - Desmonta el children cuando no está visible
 * @property {number} duration - Duración de la animación en ms
 * @property {Function} onAnimationComplete - Callback cuando termina la animación
 * @property {ViewStyle} style - Estilos adicionales
 * @property {'in' | 'out'} direction - Dirección de la animación
 */

/**
 * FadeScreen - Componente para pantallas con transición de fade
 * 
 * @param {FadeScreenProps} props 
 * 
 * @example
 * // Uso básico
 * <FadeScreen visible={isVisible}>
 *   <MyScreenContent />
 * </FadeScreen>
 * 
 * @example
 * // Con callbacks
 * <FadeScreen 
 *   visible={isVisible}
 *   onAnimationComplete={(direction) => console.log(direction)}
 * >
 *   <MyScreenContent />
 * </FadeScreen>
 */
export function FadeScreen({
  children,
  visible = true,
  unmountOnHide = true,
  duration = 300,
  onAnimationComplete,
  style,
  direction = 'in',
}) {
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.inOut(Easing.cubic),
      });
    } else {
      opacity.value = withTiming(0, {
        duration,
        easing: Easing.inOut(Easing.cubic),
      }, (finished) => {
        if (finished && onAnimationComplete) {
          runOnJS(onAnimationComplete)('out');
        }
      });
    }
  }, [visible, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: opacity.value,
    };
  });

  // Si no está visible y unmountOnHide es true, no renderizar
  if (!visible && unmountOnHide) {
    return null;
  }

  return (
    <Animated.View 
      style={[styles.container, style, animatedStyle]}
      // Necesario para que las animaciones funcionen correctamente
      {...(direction === 'out' ? { pointerEvents: visible ? 'auto' : 'none' } : {})}
    >
      {children}
    </Animated.View>
  );
}

/**
 * FadeScreenWithState - Versión con estado interno de visibilidad
 * 
 * Útil cuando necesitas controlar la animación manualmente
 */
export function FadeScreenWithState({
  children,
  duration = 300,
  onAnimationComplete,
  style,
}) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);

  const show = () => {
    if (isAnimating) return;
    setIsVisible(true);
  };

  const hide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
  };

  const handleAnimationComplete = (dir) => {
    setIsAnimating(false);
    if (dir === 'out') {
      setIsVisible(false);
    }
    if (onAnimationComplete) {
      onAnimationComplete(dir);
    }
  };

  return (
    <FadeScreen
      visible={isVisible}
      duration={duration}
      onAnimationComplete={handleAnimationComplete}
      style={style}
    >
      {React.cloneElement(children, {
        show,
        hide,
        isVisible,
        isAnimating,
      })}
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});

export default FadeScreen;
