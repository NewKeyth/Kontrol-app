/**
 * AnimatedPress - Higher Order Component (HOC) para animaciones de press
 * 
 * Wrapper que encapsula cualquier componente con animaciones de press.
 * Proporciona una forma reusable de añadir feedback visual a cualquier elemento.
 * 
 * @param {React.Component} WrappedComponent - Componente a envolver
 * @param {Object} options - Opciones de animación
 * @param {number} options.scale - Escala al presionar (default: 0.95)
 * @param {number} options.opacity - Opacidad al presionar (default: 0.8)
 * @param {Object} options.springConfig - Configuración del resorte
 * 
 * @returns {React.Component} Componente envuelto con animaciones
 * 
 * @example
 * const AnimatedView = AnimatedPress(View);
 * const AnimatedText = AnimatedPress(Text, { scale: 0.97, opacity: 0.85 });
 */

import React, { useImperativeHandle, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useAnimatedPress } from '../../hooks/useAnimatedPress';

// Valores por defecto
const DEFAULT_SCALE = 0.95;
const DEFAULT_OPACITY = 0.8;
const DEFAULT_SPRING_CONFIG = {
  damping: 15,
  stiffness: 100,
};

export function AnimatedPress(WrappedComponent, options = {}) {
  const {
    scale = DEFAULT_SCALE,
    opacity = DEFAULT_OPACITY,
    springConfig = DEFAULT_SPRING_CONFIG,
  } = options;

  const AnimatedComponent = Animated.createAnimatedComponent(WrappedComponent);

  const AnimatedPressWrapper = forwardRef((props, ref) => {
    const { animatedStyle, gesture, handlePressIn, handlePressOut, pressProgress } = useAnimatedPress({
      scale,
      opacity,
      springConfig,
    });

    // Exponer métodos al componente padre
    useImperativeHandle(ref, () => ({
      pressIn: handlePressIn,
      pressOut: handlePressOut,
      pressProgress,
    }), [handlePressIn, handlePressOut, pressProgress]);

    // Si el componente envuelto es touchable, usar GestureDetector
    const isTouchable = 
      WrappedComponent === require('react-native').TouchableOpacity ||
      WrappedComponent === require('react-native').TouchableHighlight ||
      WrappedComponent === require('react-native').Pressable ||
      WrappedComponent === require('react-native').View;

    if (isTouchable || props.onPress) {
      return (
        <GestureDetector gesture={gesture}>
          <AnimatedComponent
            {...props}
            style={[props.style, animatedStyle]}
          />
        </GestureDetector>
      );
    }

    // Para componentes no touchable, aplicar estilos animados directamente
    return (
      <AnimatedComponent
        {...props}
        style={[props.style, animatedStyle]}
      />
    );
  });

  AnimatedPressWrapper.displayName = `AnimatedPress(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AnimatedPressWrapper;
}

/**
 * Versión declarativa de AnimatedPress usando composición
 * 
 * @example
 * <AnimatedPressContainer scale={0.95} opacity={0.8}>
 *   <YourComponent />
 * </AnimatedPressContainer>
 */
export function AnimatedPressContainer({
  children,
  scale = DEFAULT_SCALE,
  opacity = DEFAULT_OPACITY,
  springConfig = DEFAULT_SPRING_CONFIG,
  onPress,
  disabled = false,
  style,
}) {
  const { animatedStyle, gesture, pressProgress } = useAnimatedPress({
    scale,
    opacity,
    springConfig,
  });

  const child = React.Children.only(children);

  return (
    <GestureDetector gesture={gesture}>
      {React.cloneElement(child, {
        style: [child.props.style, animatedStyle, style],
        onPress: onPress || child.props.onPress,
        disabled: disabled || child.props.disabled,
      })}
    </GestureDetector>
  );
}

export default AnimatedPress;
