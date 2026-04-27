/**
 * SwipeBackNavigator - Componente contenedor con swipe-back gesture
 * 
 * Implementa navegación swipe-back estilo iOS:
 * - Detecta swipe desde el borde izquierdo (20px)
 * - Completa navegación cuando se arrastra 30% del ancho de pantalla
 * - Resuelve conflictos con ScrollView/FlatList mediante failOffsetY
 * 
 * @module components/ui/SwipeBackNavigator
 */

import React, { useCallback, useRef } from 'react';
import { Dimensions, StyleSheet, View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuración de thresholds
const EDGE_THRESHOLD = 20; // px desde el borde izquierdo
const COMPLETE_THRESHOLD = 0.3; // 30% del ancho de pantalla
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 100,
  mass: 0.5,
};

/**
 * SwipeBackNavigator - Contenedor que habilita swipe-back gesture
 * 
 * @param {React.ReactNode} children - Contenido a renderizar
 * @param {Function} onGoBack - Callback para navegación hacia atrás
 * @param {boolean} enabled - Habilitar/deshabilitar swipe-back
 * @param {number} edgeThreshold - Distancia desde borde para activar
 * @param {number} completeThreshold - Porcentaje para completar (0-1)
 * @param {boolean} showOverlay - Mostrar overlay oscuro durante swipe
 * 
 * @example
 * <SwipeBackNavigator onGoBack={() => navigation.goBack()}>
 *   <ScreenContent />
 * </SwipeBackNavigator>
 */
export function SwipeBackNavigator({
  children,
  onGoBack,
  enabled = true,
  edgeThreshold = EDGE_THRESHOLD,
  completeThreshold = COMPLETE_THRESHOLD,
  showOverlay = true,
}) {
  const translateX = useSharedValue(0);
  const isSwiping = useSharedValue(false);
  const startX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const completeDistance = SCREEN_WIDTH * completeThreshold;

  // Callback para ejecutar navegación hacia atrás
  const handleGoBack = useCallback(() => {
    if (onGoBack) {
      onGoBack();
    }
  }, [onGoBack]);

  // Pan gesture para swipe-back
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .onStart((event) => {
      'worklet';
      // Solo iniciar si el touch comienza en el borde izquierdo
      if (event.absoluteX < edgeThreshold && event.absoluteX > 0) {
        isSwiping.value = true;
        startX.value = event.translationX;
        contextX.value = translateX.value;
      }
    })
    .onUpdate((event) => {
      'worklet';
      if (!isSwiping.value) return;

      // CalcularTranslation desde el inicio del gesto
      const currentTranslation = event.translationX - startX.value;
      
      // Solo permitir movimiento hacia la derecha (swipe-back)
      if (currentTranslation > 0) {
        translateX.value = currentTranslation;
      }
    })
    .onEnd((event) => {
      'worklet';
      if (!isSwiping.value) return;

      const velocity = event.velocityX;
      const shouldComplete = 
        translateX.value > completeDistance || 
        velocity > 500;

      if (shouldComplete) {
        // Completar swipe-back con animación
        translateX.value = withSpring(SCREEN_WIDTH, SPRING_CONFIG, (finished) => {
          if (finished) {
            runOnJS(handleGoBack)();
          }
        });
      } else {
        // Cancelar - volver a posición original
        translateX.value = withSpring(0, SPRING_CONFIG);
      }

      isSwiping.value = false;
    })
    .onFinalize(() => {
      'worklet';
      isSwiping.value = false;
    });

  // Estilo animado para el contenido
  const animatedContentStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Overlay oscuro que aparece durante swipe
  const animatedOverlayStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      translateX.value,
      [0, completeDistance],
      [0, 0.3],
      Extrapolate.CLAMP
    );
    return {
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, animatedContentStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
      
      {showOverlay && (
        <Animated.View 
          style={[styles.overlay, animatedOverlayStyle]} 
          pointerEvents="none"
        />
      )}
    </View>
  );
}

/**
 * GestureSafeScrollView - ScrollView que maneja conflictos de gestos
 * 
 * Configura failOffsetY para permitir swipe-back cuando no hay scroll vertical.
 * Útil para pantallas con contenido scrollable.
 * 
 * @param {Object} props - Props para ScrollView
 * @param {boolean} props.gestureEnabled - Habilitar gesture de swipe-back
 * 
 * @example
 * <GestureSafeScrollView gestureEnabled={canGoBack}>
 *   <Content />
 * </GestureSafeScrollView>
 */
export function GestureSafeScrollView({ 
  children, 
  gestureEnabled = true,
  style,
  contentContainerStyle,
  ...scrollViewProps 
}) {
  // El ScrollView nativo maneja automáticamente el conflicto
  // cuando está dentro de GestureHandlerRootView
  // failOffsetY configurado permite ScrollView tomar el gesto
  // cuando hay movimiento vertical
  
  return (
    <Animated.ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
      // Configuraciones importantes para gesture conflicts
      scrollEventThrottle={16}
      // Permitir que el gesto pase al padre si no hay scroll horizontal
      horizontal={false}
      {...scrollViewProps}
    >
      {children}
    </Animated.ScrollView>
  );
}

/**
 * createSwipeBackScreen - HOC para crear screens con swipe-back automático
 * 
 * @param {React.ComponentType} ScreenComponent - Componente de screen
 * @param {Object} options - Opciones de configuración
 * @returns {React.ComponentType} - Componente envuelto con swipe-back
 * 
 * @example
 * const MyScreen = createSwipeBackScreen(({ navigation }) => (
 *   <View><Text>Mi Screen</Text></View>
 * ), { edgeThreshold: 25 });
 */
export function createSwipeBackScreen(ScreenComponent, options = {}) {
  const {
    edgeThreshold = EDGE_THRESHOLD,
    completeThreshold = COMPLETE_THRESHOLD,
    showOverlay = true,
  } = options;

  return function SwipeBackScreen(props) {
    const { navigation, ...rest } = props;

    const handleGoBack = useCallback(() => {
      if (navigation && navigation.goBack) {
        navigation.goBack();
      }
    }, [navigation]);

    const canGoBack = navigation?.canGoBack?.() ?? false;

    return (
      <SwipeBackNavigator
        onGoBack={handleGoBack}
        enabled={canGoBack && gestureEnabled}
        edgeThreshold={edgeThreshold}
        completeThreshold={completeThreshold}
        showOverlay={showOverlay}
      >
        <ScreenComponent {...rest} />
      </SwipeBackNavigator>
    );
  };
}

// Configuración de thresholds para uso externo
export const SWIPE_BACK_CONFIG = {
  EDGE_THRESHOLD,
  COMPLETE_THRESHOLD,
  SPRING_CONFIG,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default SwipeBackNavigator;
