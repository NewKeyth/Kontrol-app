/**
 * ScreenTransition - Configuraciones de transición de pantalla
 * 
 * Proporciona presets de animación para transiciones de navegación
 * usando spring physics según las especificaciones.
 * 
 * @module navigation/ScreenTransition
 */

import { Dimensions } from 'react-native';
import { withSpring, Easing } from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================================================
// SPRING CONFIGURATIONS - Física de resorte para transiciones
// ============================================================================

/**
 * Configuraciones predefinidas de spring para transiciones de pantalla
 * Basado en spec: damping: 15, stiffness: 100, duración ~300ms
 */
export const SCREEN_SPRING_CONFIGS = {
  // Transición estándar hacia adelante
  forward: {
    damping: 15,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  // Transición estándar hacia atrás
  backward: {
    damping: 15,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  // Transición suave (más lenta)
  gentle: {
    damping: 20,
    stiffness: 80,
    mass: 1.2,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  // Transición rápida
  fast: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
  // Transición con rebote
  bouncy: {
    damping: 10,
    stiffness: 100,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// ============================================================================
// TIMING CONFIGURATIONS - Configuraciones de timing
// ============================================================================

/**
 * Configuraciones de timing para transiciones basadas en tiempo
 */
export const SCREEN_TIMING_CONFIGS = {
  // Transición rápida (~200ms)
  fast: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },
  // Transición estándar (~300ms)
  standard: {
    duration: 300,
    easing: Easing.inOut(Easing.cubic),
  },
  // Transición lenta (~400ms)
  slow: {
    duration: 400,
    easing: Easing.inOut(Easing.cubic),
  },
  // Transición muy lenta (~500ms)
  verySlow: {
    duration: 500,
    easing: Easing.inOut(Easing.cubic),
  },
};

// ============================================================================
// SCREEN DIMENSIONS - Dimensiones de pantalla
// ============================================================================

export const SCREEN_DIMENSIONS = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
};

// ============================================================================
// TRANSITION PRESETS - Presets de transición predefinidos
// ============================================================================

/**
 * Presets de transición de pantalla
 */
export const SCREEN_TRANSITION_PRESETS = {
  // Slide desde la derecha (estándar iOS)
  slideFromRight: {
    enter: {
      translateX: {
        from: SCREEN_WIDTH,
        to: 0,
        config: SCREEN_SPRING_CONFIGS.forward,
      },
      opacity: {
        from: 0,
        to: 1,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
    exit: {
      translateX: {
        from: 0,
        to: -SCREEN_WIDTH * 0.3,
        config: SCREEN_SPRING_CONFIGS.backward,
      },
      opacity: {
        from: 1,
        to: 0.8,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
  },
  // Slide desde la izquierda
  slideFromLeft: {
    enter: {
      translateX: {
        from: -SCREEN_WIDTH,
        to: 0,
        config: SCREEN_SPRING_CONFIGS.forward,
      },
      opacity: {
        from: 0,
        to: 1,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
    exit: {
      translateX: {
        from: 0,
        to: SCREEN_WIDTH * 0.3,
        config: SCREEN_SPRING_CONFIGS.backward,
      },
      opacity: {
        from: 1,
        to: 0.8,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
  },
  // Slide desde abajo
  slideFromBottom: {
    enter: {
      translateY: {
        from: SCREEN_HEIGHT,
        to: 0,
        config: SCREEN_SPRING_CONFIGS.forward,
      },
      opacity: {
        from: 0,
        to: 1,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
    exit: {
      translateY: {
        from: 0,
        to: -SCREEN_HEIGHT * 0.3,
        config: SCREEN_SPRING_CONFIGS.backward,
      },
      opacity: {
        from: 1,
        to: 0.8,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
  },
  // Slide desde arriba
  slideFromTop: {
    enter: {
      translateY: {
        from: -SCREEN_HEIGHT,
        to: 0,
        config: SCREEN_SPRING_CONFIGS.forward,
      },
      opacity: {
        from: 0,
        to: 1,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
    exit: {
      translateY: {
        from: 0,
        to: SCREEN_HEIGHT * 0.3,
        config: SCREEN_SPRING_CONFIGS.backward,
      },
      opacity: {
        from: 1,
        to: 0.8,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
  },
  // Fade simple
  fade: {
    enter: {
      opacity: {
        from: 0,
        to: 1,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
    exit: {
      opacity: {
        from: 1,
        to: 0,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
    },
  },
  // Fade con scale
  fadeScale: {
    enter: {
      opacity: {
        from: 0,
        to: 1,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
      scale: {
        from: 0.9,
        to: 1,
        config: SCREEN_SPRING_CONFIGS.gentle,
      },
    },
    exit: {
      opacity: {
        from: 1,
        to: 0,
        config: SCREEN_TIMING_CONFIGS.standard,
      },
      scale: {
        from: 1,
        to: 0.9,
        config: SCREEN_SPRING_CONFIGS.gentle,
      },
    },
  },
  // Sin animación
  none: {
    enter: {},
    exit: {},
  },
};

// ============================================================================
// TRANSITION HELPER FUNCTIONS - Funciones auxiliares
// ============================================================================

/**
 * Crea una función de animación de entrada usando withSpring
 * @param {import('react-native-reanimated').SharedValue} translateValue 
 * @param {string} direction - Dirección de la transición
 * @param {string} preset - Preset de spring
 */
export function createEnterTransition(translateValue, direction = 'right', preset = 'forward') {
  'worklet';
  const config = SCREEN_SPRING_CONFIGS[preset] || SCREEN_SPRING_CONFIGS.forward;
  
  switch (direction) {
    case 'left':
      translateValue.value = withSpring(-SCREEN_WIDTH, config);
      translateValue.value = withSpring(0, config);
      break;
    case 'right':
      translateValue.value = withSpring(SCREEN_WIDTH, config);
      translateValue.value = withSpring(0, config);
      break;
    case 'up':
      translateValue.value = withSpring(-SCREEN_HEIGHT, config);
      translateValue.value = withSpring(0, config);
      break;
    case 'down':
    default:
      translateValue.value = withSpring(SCREEN_HEIGHT, config);
      translateValue.value = withSpring(0, config);
      break;
  }
}

/**
 * Crea una función de animación de salida
 * @param {import('react-native-reanimated').SharedValue} translateValue 
 * @param {string} direction - Dirección de la transición
 * @param {string} preset - Preset de spring
 */
export function createExitTransition(translateValue, direction = 'right', preset = 'backward') {
  'worklet';
  const config = SCREEN_SPRING_CONFIGS[preset] || SCREEN_SPRING_CONFIGS.backward;
  
  switch (direction) {
    case 'left':
      translateValue.value = withSpring(-SCREEN_WIDTH * 0.3, config);
      break;
    case 'right':
      translateValue.value = withSpring(SCREEN_WIDTH * 0.3, config);
      break;
    case 'up':
      translateValue.value = withSpring(-SCREEN_HEIGHT * 0.3, config);
      break;
    case 'down':
    default:
      translateValue.value = withSpring(SCREEN_HEIGHT * 0.3, config);
      break;
  }
}

/**
 * Obtiene la configuración de spring por nombre
 * @param {string} name - Nombre del preset
 */
export function getSpringConfig(name = 'forward') {
  return SCREEN_SPRING_CONFIGS[name] || SCREEN_SPRING_CONFIGS.forward;
}

/**
 * Obtiene la configuración de timing por nombre
 * @param {string} name - Nombre del preset
 */
export function getTimingConfig(name = 'standard') {
  return SCREEN_TIMING_CONFIGS[name] || SCREEN_TIMING_CONFIGS.standard;
}

/**
 * Obtiene un preset de transición por nombre
 * @param {string} name - Nombre del preset
 */
export function getTransitionPreset(name = 'slideFromRight') {
  return SCREEN_TRANSITION_PRESETS[name] || SCREEN_TRANSITION_PRESETS.slideFromRight;
}

export default {
  SCREEN_SPRING_CONFIGS,
  SCREEN_TIMING_CONFIGS,
  SCREEN_DIMENSIONS,
  SCREEN_TRANSITION_PRESETS,
  createEnterTransition,
  createExitTransition,
  getSpringConfig,
  getTimingConfig,
  getTransitionPreset,
};
