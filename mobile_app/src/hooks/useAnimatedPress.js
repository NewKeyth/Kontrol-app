/**
 * useAnimatedPress - Hook reutilizable para animaciones de press
 * 
 * Proporciona animaciones de escala y opacidad basadas en spring physics
 * para crear feedback visual cuando el usuario presiona elementos.
 * 
 * @param options.scale - Escala objetivo al presionar (default: 0.95)
 * @param options.opacity - Opacidad objetivo al presionar (default: 0.8)
 * @param options.springConfig - Configuración del resorte (damping, stiffness)
 * 
 * @returns {animatedStyle, gesture, pressProgress}
 */

import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

const DEFAULT_SPRING_CONFIG = {
  damping: 15,
  stiffness: 100,
};

export function useAnimatedPress({
  scale = 0.95,
  opacity = 0.8,
  springConfig = DEFAULT_SPRING_CONFIG,
} = {}) {
  'worklet';
  
  // Shared values para animaciones en UI thread
  const pressProgress = useSharedValue(0);
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);

  // Animación con spring para sensación natural
  const handlePressIn = () => {
    'worklet';
    pressProgress.value = withSpring(1, springConfig);
    scaleValue.value = withSpring(scale, springConfig);
    opacityValue.value = withSpring(opacity, springConfig);
  };

  const handlePressOut = () => {
    'worklet';
    pressProgress.value = withSpring(0, springConfig);
    scaleValue.value = withSpring(1, springConfig);
    opacityValue.value = withSpring(1, springConfig);
  };

  // Gesture de tap
  const gesture = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      handlePressIn();
    })
    .onFinalize(() => {
      'worklet';
      handlePressOut();
    });

  // Estilos animados
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scaleValue.value }],
      opacity: opacityValue.value,
    };
  });

  return {
    animatedStyle,
    gesture,
    pressProgress,
    handlePressIn,
    handlePressOut,
  };
}

export default useAnimatedPress;