/**
 * useListAnimation - Hook para animaciones stagger en listas
 * 
 * Proporciona control sobre animaciones de entrada escalonada (staggered)
 * para múltiples items de lista. Cada item puede animarse con un delay
 * progresivo desde el anterior.
 * 
 * @param {number} itemCount - Número total de items
 * @param {number} staggerDelay - Delay entre cada item en ms (default: 50)
 * @param {boolean} animate - Controla si las animaciones deben ejecutarse
 * 
 * @returns {itemStates, triggerAnimation, resetAnimation}
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Estados posibles de animación para cada item
 */
export const ITEM_STATES = {
  HIDDEN: 'hidden',
  ENTERING: 'entering',
  VISIBLE: 'visible',
  EXITING: 'exiting',
};

/**
 * Configuración de timing por defecto
 */
const DEFAULT_CONFIG = {
  staggerDelay: 50,
  entranceDuration: 300,
  exitDuration: 200,
};

export function useListAnimation({
  itemCount = 0,
  staggerDelay = DEFAULT_CONFIG.staggerDelay,
  animate = true,
} = {}) {
  // Estado de cada item
  const [itemStates, setItemStates] = useState(() => 
    Array.from({ length: itemCount }, () => ITEM_STATES.HIDDEN)
  );

  // Refs para tracking de animación
  const animationRef = useRef({
    isAnimating: false,
    completedCount: 0,
  });

  // Actualizar estados cuando cambia el número de items
  useEffect(() => {
    setItemStates(prev => {
      const newStates = [...prev];
      // Asegurar que tenemos el tamaño correcto
      while (newStates.length < itemCount) {
        newStates.push(ITEM_STATES.HIDDEN);
      }
      return newStates.slice(0, itemCount);
    });
  }, [itemCount]);

  /**
   * Inicia la animación de entrada para todos los items
   * con stagger delay entre cada uno
   */
  const triggerAnimation = useCallback(() => {
    if (!animate || animationRef.current.isAnimating) return;
    
    animationRef.current = {
      isAnimating: true,
      completedCount: 0,
    };

    // Resetear estados
    setItemStates(prev => 
      prev.map((state, index) => 
        index < itemCount ? ITEM_STATES.ENTERING : state
      )
    );

    // Programar cada item con su delay
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setItemStates(prev => {
          const newStates = [...prev];
          if (newStates[i] === ITEM_STATES.ENTERING) {
            newStates[i] = ITEM_STATES.VISIBLE;
          }
          return newStates;
        });
        
        // Contar completados
        animationRef.current.completedCount++;
        if (animationRef.current.completedCount >= itemCount) {
          animationRef.current.isAnimating = false;
        }
      }, i * staggerDelay + DEFAULT_CONFIG.entranceDuration);
    }
  }, [itemCount, staggerDelay, animate]);

  /**
   * Resetea todos los items al estado hidden
   */
  const resetAnimation = useCallback(() => {
    animationRef.current = {
      isAnimating: false,
      completedCount: 0,
    };
    setItemStates(Array.from({ length: itemCount }, () => ITEM_STATES.HIDDEN));
  }, [itemCount]);

  /**
   * Actualiza el estado de un item específico
   */
  const setItemState = useCallback((index, state) => {
    if (index >= 0 && index < itemCount) {
      setItemStates(prev => {
        const newStates = [...prev];
        newStates[index] = state;
        return newStates;
      });
    }
  }, [itemCount]);

  /**
   * Obtiene el delay para un índice específico
   */
  const getDelayForIndex = useCallback((index) => {
    return index * staggerDelay;
  }, [staggerDelay]);

  /**
   * Verifica si un item está visible
   */
  const isItemVisible = useCallback((index) => {
    return itemStates[index] === ITEM_STATES.VISIBLE;
  }, [itemStates]);

  /**
   * Verifica si la animación está en progreso
   */
  const isAnimating = useCallback(() => {
    return animationRef.current.isAnimating;
  }, []);

  return {
    itemStates,
    triggerAnimation,
    resetAnimation,
    setItemState,
    getDelayForIndex,
    isItemVisible,
    isAnimating,
    ITEM_STATES,
  };
}

export default useListAnimation;
