/**
 * AnimatedCard - Card con animaciones de press
 * 
 * Componente de tarjeta que proporciona feedback visual sutil
 * mediante animaciones de escala y opacidad al ser presionado.
 * 
 * @param {React.Node} children - Contenido de la card
 * @param {Function} onPress - Callback al presionar (opcional)
 * @param {number} scale - Escala al presionar (default: 0.98)
 * @param {number} opacity - Opacidad al presionar (default: 0.9)
 * @param {Object} style - Estilos adicionales
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useAnimatedPress } from '../../hooks/useAnimatedPress';

// Colores del tema Glow/Verde
const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
  background: '#0F1711',
  border: '#243628',
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedCard({
  children,
  onPress,
  scale = 0.98,
  opacity = 0.9,
  style,
  ...props
}) {
  const { animatedStyle, gesture } = useAnimatedPress({
    scale,
    opacity,
    springConfig: {
      damping: 15,
      stiffness: 100,
    },
  });

  // Si hay onPress, usar GestureDetector con Pressable animado
  if (onPress) {
    return (
      <GestureDetector gesture={gesture}>
        <AnimatedPressable
          onPress={onPress}
          activeOpacity={1}
          style={[
            styles.card,
            animatedStyle,
            style,
          ]}
          {...props}
        >
          {children}
        </AnimatedPressable>
      </GestureDetector>
    );
  }

  // Sin onPress, retornar solo View animada
  return (
    <Animated.View style={[styles.card, animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
    shadowColor: COLORS.glow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
});

export default AnimatedCard;
