/**
 * LoadingDemo - Ejemplo de uso de componentes de Loading
 * 
 * Este archivo demuestra cómo integrar los componentes de loading
 * en la app. Usage: importar y usar como referencia.
 * 
 * @usage
 * import LoadingDemo from './src/components/LoadingDemo';
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  FlatList,
  TouchableOpacity 
} from 'react-native';
import { 
  SkeletonLoader, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonButton 
} from './ui/SkeletonLoader';
import { 
  AnimatedSpinner, 
  ButtonSpinner, 
  SpinnerWithText, 
  FullScreenSpinner 
} from './ui/AnimatedSpinner';
import { useLoading } from '../hooks/useLoading';

// Colores del tema
const COLORS = {
  glow: '#6EE891',
  accent: '#89B990',
  surface: '#1A261D',
  background: '#0F1711',
  text: '#E0EFE1',
};

// Componente de ejemplo: Pantalla con Skeleton
function SkeletonScreenExample() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla con Skeleton</Text>
      
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <View style={{ height: 16 }} />
          <SkeletonText lines={4} />
          <View style={{ height: 16 }} />
          <View style={styles.row}>
            <SkeletonAvatar size={40} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <SkeletonLoader width="60%" height={14} />
              <SkeletonLoader width="40%" height={10} style={{ marginTop: 4 }} />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.contentText}>Contenido cargado!</Text>
        </View>
      )}
    </View>
  );
}

// Componente de ejemplo: Lista con Skeleton
function SkeletonListExample() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>{item.title}</Text>
    </View>
  );

  const data = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lista con Skeleton</Text>
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLoader 
              key={index}
              width="100%" 
              height={60} 
              borderRadius={8}
              style={{ marginBottom: 8 }}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista con Skeleton</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

// Componente de ejemplo: Spinner variants
function SpinnerExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spinners</Text>
      
      <View style={styles.spinnerRow}>
        <View style={styles.spinnerItem}>
          <AnimatedSpinner size={40} />
          <Text style={styles.spinnerLabel}>Default</Text>
        </View>
        
        <View style={styles.spinnerItem}>
          <AnimatedSpinner size={40} color="#89B990" speed={1500} />
          <Text style={styles.spinnerLabel}>Slow</Text>
        </View>
        
        <View style={styles.spinnerItem}>
          <AnimatedSpinner size={40} color="#E86E6E" speed={600} />
          <Text style={styles.spinnerLabel}>Fast</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Con texto</Text>
        <SpinnerWithText text="Cargando datos..." />
      </View>
    </View>
  );
}

// Componente de ejemplo: useLoading hook
function UseLoadingExample() {
  const { isLoading, startLoading, stopLoading, withLoading } = useLoading();
  const [data, setData] = useState(null);

  const handleLoadManual = async () => {
    startLoading();
    // Simular API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setData({ message: 'Datos cargados manualmente!' });
    stopLoading();
  };

  const handleLoadAuto = async () => {
    const result = await withLoading(
      new Promise(resolve => {
        setTimeout(() => resolve({ message: 'Datos con withLoading!' }), 2000);
      })
    );
    setData(result);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>useLoading Hook</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={handleLoadManual}
        disabled={isLoading}
      >
        {isLoading ? (
          <ButtonSpinner color={COLORS.background} />
        ) : (
          <Text style={styles.buttonText}>Carga Manual</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleLoadAuto}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>Carga Automática</Text>
      </TouchableOpacity>

      {data && (
        <View style={styles.result}>
          <Text style={styles.resultText}>{data.message}</Text>
        </View>
      )}
    </View>
  );
}

// Demo principal
export default function LoadingDemo() {
  const [activeTab, setActiveTab] = useState('skeleton');

  const tabs = [
    { key: 'skeleton', label: 'Skeleton' },
    { key: 'list', label: 'Lista' },
    { key: 'spinner', label: 'Spinner' },
    { key: 'hook', label: 'Hook' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'skeleton':
        return <SkeletonScreenExample />;
      case 'list':
        return <SkeletonListExample />;
      case 'spinner':
        return <SpinnerExample />;
      case 'hook':
        return <UseLoadingExample />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.main}>
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: COLORS.glow,
  },
  tabText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    color: COLORS.background,
  },
  content: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 16,
  },
  skeletonContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
  },
  contentText: {
    color: COLORS.text,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItem: {
    padding: 16,
    backgroundColor: COLORS.surface,
    marginBottom: 8,
    borderRadius: 8,
  },
  listItemText: {
    color: COLORS.text,
    fontSize: 14,
  },
  spinnerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  spinnerItem: {
    alignItems: 'center',
  },
  spinnerLabel: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 8,
  },
  section: {
    marginTop: 24,
    alignItems: 'center',
  },
  button: {
    backgroundColor: COLORS.glow,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    alignItems: 'center',
  },
  resultText: {
    color: COLORS.glow,
    fontSize: 14,
    fontWeight: '600',
  },
});
