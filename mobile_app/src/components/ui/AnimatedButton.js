/**
 * AnimatedButton - Botón con animaciones de press
 * 
 * Componente de botón que proporciona feedback visual mediante
 * animaciones de escala y opacidad al ser presionado.
 * 
 * @param {Function} onPress - Callback al presionar
 * @param {React.Node} children - Contenido del botón
 * @param {string} variant - Variante visual: 'primary' | 'secondary' | 'outline'
 * @param {number} scale - Escala al presionar (default: 0.95)
 * @param {number} opacity - Opacidad al presionar (default: 0.8)
 * @param {boolean} disabled - Deshabilitar interacciones
 * @param {boolean} loading - Mostrar estado de carga
 * @param {Object} style - Estilos adicionales
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useAnimatedPress } from '../../hooks/useAnimatedPress';

// Colores del tema Glow/Verde
const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
  background: '#0F1711',
  text: '#E0EFE1',
  btnBase: '#2A3B2E',
  btnActive: '#4A8B55',
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AnimatedButton({
  onPress,
  children,
  variant = 'primary',
  scale = 0.95,
  opacity = 0.8,
  disabled = false,
  loading = false,
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

  // Estilos según variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: COLORS.surface,
          borderWidth: 1,
          borderColor: COLORS.accent,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: COLORS.glow,
        };
      case 'primary':
      default:
        return {
          backgroundColor: COLORS.glow,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return COLORS.glow;
      case 'secondary':
        return COLORS.text;
      case 'primary':
      default:
        return COLORS.background;
    }
  };

  const variantStyles = getVariantStyles();
  const textColor = getTextColor();

  return (
    <GestureDetector gesture={gesture}>
      <AnimatedTouchable
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[
          styles.button,
          variantStyles,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : typeof children === 'string' ? (
          <Text style={[styles.text, { color: textColor }]}>{children}</Text>
        ) : (
          children
        )}
      </AnimatedTouchable>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    elevation: 4,
    shadowColor: COLORS.glow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default AnimatedButton;
