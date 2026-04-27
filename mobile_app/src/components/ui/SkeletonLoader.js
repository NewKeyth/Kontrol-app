/**
 * SkeletonLoader - Componente de esqueleto con animación shimmer
 * 
 * Muestra un placeholder visual mientras los datos están cargando.
 * La animación shimmer se mueve de izquierda a derecha continuamente.
 * 
 * @param {number} width - Ancho del skeleton (default: '100%')
 * @param {number} height - Altura del skeleton (default: 20)
 * @param {string} borderRadius - Radio del borde (default: 4)
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
  interpolate,
} from 'react-native-reanimated';

const COLORS = {
  surface: '#1A261D',
  background: '#0F1711',
  shimmer: '#2A3B2E',
  shimmerHighlight: '#3A5B4E',
};

const SHIMMER_DURATION = 1500; // 1.5s para una animación completa

export function SkeletonLoader({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, {
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false // No reverse
    );
  }, [shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    // El shimmer se mueve de -100% a 200% para cubrir toda el área
    const translateX = interpolate(
      shimmerProgress.value,
      [0, 1],
      [-100, 200]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmerOverlay, animatedStyle]} />
    </View>
  );
}

// Skeleton para texto (múltiples líneas)
export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  lastLineWidth = '60%',
  spacing = 8,
}) {
  return (
    <View style={styles.textContainer}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLoader
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

// Skeleton para card
export function SkeletonCard({ height = 120 }) {
  return (
    <View style={[styles.card, { height }]}>
      <SkeletonLoader width="100%" height={80} borderRadius={8} />
      <View style={styles.cardContent}>
        <SkeletonLoader width="70%" height={16} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

// Skeleton para avatar
export function SkeletonAvatar({ size = 48 }) {
  return (
    <SkeletonLoader
      width={size}
      height={size}
      borderRadius={size / 2}
    />
  );
}

// Skeleton para botón
export function SkeletonButton({ width = 120, height = 48 }) {
  return (
    <SkeletonLoader
      width={width}
      height={height}
      borderRadius={25}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.shimmer,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.shimmerHighlight,
    opacity: 0.5,
  },
  textContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    overflow: 'hidden',
  },
  cardContent: {
    marginTop: 12,
  },
});

export default SkeletonLoader;
