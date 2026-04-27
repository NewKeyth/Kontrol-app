/**
 * Staggered Animation Helpers - Funciones helper para animaciones stagger
 * 
 * Utilidades para crear animaciones escalonadas (staggered) en listas
 * y colecciones. Proporciona funciones para calcular delays y configurar
 * valores animados.
 * 
 * @module staggeredAnimation
 */

import {
  withSpring,
  withDelay,
  withTiming,
  Easing,
  interpolate,
  SharedValue,
} from 'react-native-reanimated';

/**
 * Configuraciones predefinidas de spring para diferentes efectos
 */
export const STAGGER_SPRING_CONFIGS = {
  // Rápido y sutil
  quick: {
    damping: 20,
    stiffness: 200,
    mass: 0.5,
  },
  // Normal (balanceado)
  normal: {
    damping: 18,
    stiffness: 120,
    mass: 0.8,
  },
  // Suave y elegante
  elegant: {
    damping: 25,
    stiffness: 80,
    mass: 1,
  },
  // Bounce趣味
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.7,
  },
};

/**
 * Crea una función de animación de entrada con stagger
 * 
 * @param {number} index - Índice del item
 * @param {number} baseDelay - Delay base entre items
 * @param {object} springConfig - Configuración del spring
 * @param {number} entranceDuration - Duración de la animación (aproximada)
 * 
 * @returns {object} Objeto con funciones worklet para aplicar
 */
export function createEntranceAnimation(index, baseDelay = 50, springConfig = STAGGER_SPRING_CONFIGS.normal) {
  const delay = index * baseDelay;
  
  return {
    /**
     * Calcula el valor de opacidad animado
     * @param {number} progress - Progreso de 0 a 1
     */
    opacity: (progress) => {
      'worklet';
      return interpolate(progress, [0, 1], [0, 1]);
    },
    
    /**
     * Calcula el valor de translateY animado
     * @param {number} progress - Progreso de 0 a 1
     */
    translateY: (progress) => {
      'worklet';
      return interpolate(progress, [0, 1], [20, 0]);
    },
    
    /**
     * Calcula el valor de scale animado
     * @param {number} progress - Progreso de 0 a 1
     */
    scale: (progress) => {
      'worklet';
      return interpolate(progress, [0, 1], [0.95, 1]);
    },
    
    /**
     * Calcula el delay para este índice
     */
    getDelay: () => delay,
    
    /**
     * Aplica la animación de entrada a un shared value
     * @param {SharedValue} sharedValue - El valor animado
     */
    apply: (sharedValue) => {
      'worklet';
      return withDelay(delay, withSpring(1, springConfig));
    },
  };
}

/**
 * Crea una función de animación de salida con stagger
 * 
 * @param {number} index - Índice del item
 * @param {number} baseDelay - Delay base entre items (invertido para salir)
 * @param {object} springConfig - Configuración del spring
 */
export function createExitAnimation(index, baseDelay = 30, springConfig = STAGGER_SPRING_CONFIGS.quick) {
  // Los items salen en orden inverso (último sale primero)
  const delay = index * baseDelay;
  
  return {
    opacity: (progress) => {
      'worklet';
      return interpolate(progress, [0, 1], [1, 0]);
    },
    
    translateY: (progress) => {
      'worklet';
      return interpolate(progress, [0, 1], [0, -10]);
    },
    
    scale: (progress) => {
      'worklet';
      return interpolate(progress, [0, 1], [1, 0.9]);
    },
    
    getDelay: () => delay,
    
    apply: (sharedValue) => {
      'worklet';
      return withDelay(delay, withSpring(0, springConfig));
    },
  };
}

/**
 * Calcula el delay total para una animación de entrada
 * 
 * @param {number} totalItems - Número total de items
 * @param {number} baseDelay - Delay entre cada item
 * @param {number} itemDuration - Duración de animación de un item
 * 
 * @returns {number} Delay total en milisegundos
 */
export function calculateTotalEntranceDelay(totalItems, baseDelay = 50, itemDuration = 300) {
  return (totalItems - 1) * baseDelay + itemDuration;
}

/**
 * Calcula el delay total para una animación de salida
 * 
 * @param {number} totalItems - Número total de items
 * @param {number} baseDelay - Delay entre cada item
 * @param {number} itemDuration - Duración de animación de un item
 * 
 * @returns {number} Delay total en milisegundos
 */
export function calculateTotalExitDelay(totalItems, baseDelay = 30, itemDuration = 200) {
  return (totalItems - 1) * baseDelay + itemDuration;
}

/**
 * Crea un array de configuraciones de stagger para múltiples items
 * 
 * @param {number} count - Número de items
 * @param {number} baseDelay - Delay base entre items
 * @param {object} springConfig - Configuración de spring
 * @param {boolean} reverse - Si es true, invierte el orden
 * 
 * @returns {Array} Array de configuraciones de stagger
 */
export function createStaggerConfigArray(count, baseDelay = 50, springConfig, reverse = false) {
  const configs = [];
  
  for (let i = 0; i < count; i++) {
    const index = reverse ? count - 1 - i : i;
    configs.push(createEntranceAnimation(index, baseDelay, springConfig));
  }
  
  return configs;
}

/**
 * Hook helper para usar con createAnimatedStyle
 * Aplica transformaciones stagger a un estilo animado
 * 
 * @param {SharedValue} progress - Shared value de progreso (0-1)
 * @param {object} config - Configuración de stagger
 * 
 * @returns {object} Estilos animados con transformaciones aplicadas
 */
export function useStaggerTransforms(progress, config) {
  'worklet';
  
  const { opacity, translateY, scale } = config;
  
  return {
    opacity: opacity(progress.value),
    transform: [
      { translateY: translateY(progress.value) },
      { scale: scale(progress.value) },
    ],
  };
}

/**
 * Easing functions predefinidas para stagger
 */
export const STAGGER_EASINGS = {
  // Lineal
  linear: Easing.linear,
  
  // Ease out
  easeOut: Easing.out(Easing.cubic),
  
  // Ease in
  easeIn: Easing.in(Easing.cubic),
  
  // Ease in-out
  easeInOut: Easing.inOut(Easing.cubic),
  
  // Suave
  soft: Easing.bezier(0.25, 0.1, 0.25, 1),
  
  // Elástico
  elastic: Easing.bezier(0.68, -0.55, 0.265, 1.55),
};

export default {
  STAGGER_SPRING_CONFIGS,
  createEntranceAnimation,
  createExitAnimation,
  calculateTotalEntranceDelay,
  calculateTotalExitDelay,
  createStaggerConfigArray,
  useStaggerTransforms,
  STAGGER_EASINGS,
};
