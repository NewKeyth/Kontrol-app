/**
 * AnimatedSpinner - Spinner animado con rotación continua
 * 
 * Indicador de carga animado que rota continuamente.
 * Alternativa visual al ActivityIndicator nativo.
 * 
 * @param {number} size - Tamaño del spinner (default: 40)
 * @param {string} color - Color del spinner (default: #6EE891 - glow)
 * @param {number} speed - Velocidad de rotación en ms (default: 1000)
 * @param {Object} style - Estilos adicionales
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
};

export function AnimatedSpinner({
  size = 40,
  color = COLORS.glow,
  speed = 1000,
  style,
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: speed,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // No reverse
    );
  }, [rotation, speed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const innerSize = size * 0.7;
  const strokeWidth = size * 0.1;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Círculo exterior con gap */}
      <Animated.View
        style={[
          styles.spinnerRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            opacity: 0.3,
          },
        ]}
      />
      
      {/* Círculo animado */}
      <Animated.View
        style={[
          styles.spinnerActive,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Spinner pequeño para botones
export function ButtonSpinner({ size = 20, color = '#0F1711' }) {
  return (
    <AnimatedSpinner
      size={size}
      color={color}
      speed={800}
    />
  );
}

// Spinner grande para full-screen
export function FullScreenSpinner() {
  return (
    <View style={styles.fullScreen}>
      <AnimatedSpinner size={60} />
    </View>
  );
}

// Spinner con texto
export function SpinnerWithText({ 
  text = 'Cargando...', 
  size = 40, 
  color = COLORS.glow 
}) {
  const { Text } = require('react-native');
  
  return (
    <View style={styles.withText}>
      <AnimatedSpinner size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerRing: {
    position: 'absolute',
  },
  spinnerActive: {
    position: 'absolute',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  withText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.glow,
    fontWeight: '500',
  },
});

export default AnimatedSpinner;
