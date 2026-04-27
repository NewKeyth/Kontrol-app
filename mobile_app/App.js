import { useState, useEffect, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Vibration,
  TextInput,
  Alert,
  ScrollView,
  Animated,
  Linking,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as NavigationBar from 'expo-navigation-bar';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MARGIN_LATERAL = 18;
const RADIO_JOYSTICK = 45;
const ZONA_MUERTA = 12;
const K_HOLD_TIME = 1500;
const VERDE_CONEXION = '#6EE891';
const APP_VERSION = '1.0.0';

// ═══════════════════════════════════════════════
// 📜 CHANGELOG DATA
// ═══════════════════════════════════════════════
const CHANGELOG = [
  { v: '1.0.0', t: 'Lanzamiento Estable', d: ['Soporte para 4 jugadores simultáneos.', 'Nuevo servidor con consola de logs.', 'Mejoras visuales y de rendimiento.', 'Conexión WiFi estable y temas dinámicos.'] },
];

const PRIVACY_URL = 'https://newkeyth.github.io/kontrol_privacy/';
const FEEDBACK_URL ='https://docs.google.com/forms/d/e/1FAIpQLSfMaKDiP2Q2sPshA-G9gCfSA5kU32gwqChEoITQiEcLEQ05ng/viewform';

const TEMAS = {
  verde: {
    nombre: 'Verde', glow: '#6EE891', accent: '#7AA380', accentDark: '#3A5241',
    btnBase: '#15241B', btnBaseSoft: '#111B14', btnActive: '#264531', btnActiveSoft: '#1D3525',
    surface: '#0E1A14', surfaceDeep: '#08110D', bg: '#050A08', border: '#162B1E', text: '#D8ECD9',
  },
  azul: {
    nombre: 'Azul', glow: '#6EB5E8', accent: '#89A8B9', accentDark: '#4A5C6E',
    btnBase: '#2A3340', btnBaseSoft: '#1E2830', btnActive: '#4A7B9B', btnActiveSoft: '#3D6888',
    surface: '#1A2226', surfaceDeep: '#141B1E', bg: '#0F1315', border: '#243038', text: '#E0EBEF',
  },
  rojo: {
    nombre: 'Rojo', glow: '#E86E6E', accent: '#B98989', accentDark: '#6E4A4A',
    btnBase: '#3B2A2A', btnBaseSoft: '#2B1E1E', btnActive: '#8B4A4A', btnActiveSoft: '#783D3D',
    surface: '#261A1A', surfaceDeep: '#1E1414', bg: '#130F0F', border: '#382424', text: '#EFE0E0',
  },
  morado: {
    nombre: 'Morado', glow: '#B06EE8', accent: '#A089B9', accentDark: '#5C4A6E',
    btnBase: '#332A3B', btnBaseSoft: '#281E2B', btnActive: '#7B4A8B', btnActiveSoft: '#683D78',
    surface: '#221A26', surfaceDeep: '#1B141E', bg: '#150F17', border: '#302438', text: '#EBE0EF',
  },
};

// ═══════════════════════════════════════════════
// 💧 RIPPLE EFFECT (Material Design)
// ═══════════════════════════════════════════════
const RippleEffect = ({ onPress, onPressIn, onPressOut, children, style, disabled, color }) => {
  const [ripples, setRipples] = useState([]);
  const rippleId = useRef(0);

  const handlePress = (e) => {
    if (disabled) return;
    
    // Crear nuevo ripple
    const { pageX, pageY } = e.nativeEvent;
    const newRipple = {
      id: rippleId.current++,
      x: pageX,
      y: pageY,
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remover ripple después de animación
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    if (onPress) onPress(e);
    if (onPressIn) onPressIn();
  };

  const handlePressIn = (e) => {
    if (disabled) return;
    if (onPressIn) onPressIn();
    handlePress(e);
  };

  const handlePressOut = () => {
    if (disabled) return;
    if (onPressOut) onPressOut();
  };

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.9}
      style={style}
    >
      {children}
      {ripples.map(ripple => (
        <View
          key={ripple.id}
          style={{
            position: 'absolute',
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: color || '#FFFFFF',
            opacity: 0.3,
            left: ripple.x - 50,
            top: ripple.y - 50,
          }}
        />
      ))}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════
// 🎭 SPRING BUTTON (Animated spring scale)
// ═══════════════════════════════════════════════
const SpringButton = ({ onPress, children, style, disabled, glowColor }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <RippleEffect 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      color={glowColor}
    >
      <Animated.View style={[style, { flex: 1, transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </RippleEffect>
  );
};

// ═══════════════════════════════════════════════
// 💀 SKELETON LOADER
// ═══════════════════════════════════════════════
const SkeletonLoader = ({ width, height, borderRadius = 8, style }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#2A3B2E',
        },
        style,
        { opacity },
      ]}
    />
  );
};

// ═══════════════════════════════════════════════
// ✨ GLOW INTERNO
// ═══════════════════════════════════════════════
const GlowInterno = ({ activo, borderRadius = 999, color }) => {
  const op = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(op, { toValue: activo ? 1 : 0, duration: activo ? 50 : 180, useNativeDriver: true }).start();
  }, [activo]);
  return (
    <Animated.View pointerEvents="none" style={{
      ...StyleSheet.absoluteFillObject, borderRadius,
      backgroundColor: color, opacity: Animated.multiply(op, 0.25),
    }} />
  );
};

// ═══════════════════════════════════════════════
// ⭕ CÍRCULO PROGRESO K
// ═══════════════════════════════════════════════
const CirculoProgresoK = ({ activo, color }) => {
  const progreso = useRef(new Animated.Value(0)).current;
  const animRef = useRef(null);
  useEffect(() => {
    if (activo) {
      progreso.setValue(0);
      animRef.current = Animated.timing(progreso, { toValue: 1, duration: K_HOLD_TIME, useNativeDriver: false });
      animRef.current.start();
    } else { if (animRef.current) animRef.current.stop(); progreso.setValue(0); }
  }, [activo]);

  const SIZE = 56;
  const OFFSET = (44 - SIZE) / 2;
  const segs = [
    { rotate: '0deg', range: [0, 0.25] }, { rotate: '90deg', range: [0.25, 0.5] },
    { rotate: '180deg', range: [0.5, 0.75] }, { rotate: '270deg', range: [0.75, 1] },
  ];

  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: SIZE, height: SIZE, top: OFFSET, left: OFFSET }}>
      {segs.map((s, i) => {
        const op = progreso.interpolate({ inputRange: s.range, outputRange: [0, 1], extrapolate: 'clamp' });
        return <Animated.View key={i} style={{
          position: 'absolute', width: SIZE, height: SIZE, borderRadius: SIZE / 2,
          borderWidth: 3, borderColor: 'transparent', borderTopColor: color,
          opacity: op, transform: [{ rotate: s.rotate }],
        }} />;
      })}
    </View>
  );
};

// ═══════════════════════════════════════════════
// 💡 INDICADOR CONEXIÓN
// ═══════════════════════════════════════════════
const IndicadorConexion = ({ conectado, estilo }) => {
  const pulso = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (conectado) {
      const a = Animated.loop(Animated.sequence([
        Animated.timing(pulso, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])); a.start(); return () => a.stop();
    } else pulso.setValue(1);
  }, [conectado]);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, estilo]}>
      <View style={{ width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
        {conectado && <Animated.View style={{ position: 'absolute', width: 20, height: 20, borderRadius: 10, backgroundColor: VERDE_CONEXION, opacity: 0.3, transform: [{ scale: pulso }] }} />}
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: conectado ? VERDE_CONEXION : '#FF4444' }} />
      </View>
      <Text style={{ color: conectado ? VERDE_CONEXION : '#FF4444', fontSize: 13, fontWeight: 'bold' }}>
        {conectado ? 'En línea' : 'Sin conexión'}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════
// 🔌 BOTÓN POWER
// ═══════════════════════════════════════════════
const BotonPower = ({ estado, onPress }) => {
  const pulsoC = useRef(new Animated.Value(1)).current;
  const pulsoL = useRef(new Animated.Value(0.3)).current;
  const anilloS = useRef(new Animated.Value(0)).current;
  const anilloO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (estado === 'conectado') {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(anilloS, { toValue: 2.5, duration: 600, useNativeDriver: true }),
          Animated.timing(anilloO, { toValue: 0.5, duration: 100, useNativeDriver: true }),
        ]),
        Animated.timing(anilloO, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start(() => anilloS.setValue(0));
      const l = Animated.loop(Animated.sequence([
        Animated.timing(pulsoC, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulsoC, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])); l.start(); return () => l.stop();
    } else if (estado === 'conectando') {
      const l = Animated.loop(Animated.sequence([
        Animated.timing(pulsoL, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulsoL, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])); l.start(); return () => l.stop();
    } else { pulsoC.setValue(1); pulsoL.setValue(0.3); }
  }, [estado]);

  const c = { desconectado: { bg: '#1E2B22', icon: '#4A634E', ring: '#2A3B2E' }, conectando: { bg: '#1E2B22', icon: VERDE_CONEXION, ring: '#2A3B2E' }, conectado: { bg: '#1A3D25', icon: VERDE_CONEXION, ring: VERDE_CONEXION } }[estado];
  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity onPress={onPress} disabled={estado === 'conectando'} activeOpacity={0.7}>
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, borderWidth: 2, borderColor: VERDE_CONEXION, opacity: anilloO, transform: [{ scale: anilloS }] }} />
          {estado === 'conectado' && <Animated.View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: VERDE_CONEXION, opacity: 0.15, transform: [{ scale: pulsoC }] }} />}
          <View style={{ width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: estado === 'conectado' ? VERDE_CONEXION : c.ring, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
            <Animated.View style={{ opacity: estado === 'conectando' ? pulsoL : 1 }}>
              <MaterialIcons name="power-settings-new" size={55} color={c.icon} />
            </Animated.View>
          </View>
        </View>
      </TouchableOpacity>
      <Text style={{ color: estado === 'conectado' ? VERDE_CONEXION : estado === 'conectando' ? '#89B990' : '#4A634E', fontSize: 16, fontWeight: 'bold', marginTop: 15, letterSpacing: 2 }}>
        {{ desconectado: 'CONECTAR', conectando: 'CONECTANDO...', conectado: 'EN LÍNEA' }[estado]}
      </Text>
    </View>
  );
};

// ═══════════════════════════════════════════════
// 🎓 ONBOARDING
// ═══════════════════════════════════════════════
const PantallaOnboarding = ({ onTerminar, tema }) => {
  const [paso, setPaso] = useState(0);
  const pasos = [
    { icon: 'computer', titulo: 'Paso 1: Servidor PC', desc: 'Ejecuta KONTROL Server\nen tu computadora.' },
    { icon: 'wifi-tethering', titulo: 'Paso 2: Misma Red', desc: 'Asegúrate de que tu celular y PC\nestén en la misma red WiFi.' },
    { icon: 'gamepad', titulo: 'Paso 3: ¡A Jugar!', desc: 'Conecta desde la app, elige\ntu mando y disfruta.' },
  ];
  const avanzar = async () => {
    if (paso < 2) setPaso(paso + 1);
    else { try { await AsyncStorage.setItem('@kontrol_onboarding', 'done'); } catch (e) {} onTerminar(); }
  };
  const p = pasos[paso];
  return (
    <View style={{ flex: 1, backgroundColor: tema.bg, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
      <MaterialIcons name={p.icon} size={80} color={tema.glow} />
      <Text style={{ color: tema.text, fontSize: 24, fontWeight: 'bold', marginTop: 30, textAlign: 'center' }}>{p.titulo}</Text>
      <Text style={{ color: tema.accent, fontSize: 16, marginTop: 15, textAlign: 'center', lineHeight: 24 }}>{p.desc}</Text>
      <View style={{ flexDirection: 'row', marginTop: 50, gap: 8 }}>
        {[0, 1, 2].map(i => <View key={i} style={{ width: i === paso ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === paso ? tema.glow : tema.accentDark }} />)}
      </View>
      <TouchableOpacity onPress={avanzar} style={{ marginTop: 40, backgroundColor: tema.glow, paddingVertical: 14, paddingHorizontal: 50, borderRadius: 25 }}>
        <Text style={{ color: tema.bg, fontSize: 16, fontWeight: 'bold' }}>{paso < 2 ? 'SIGUIENTE' : 'EMPEZAR'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ═══════════════════════════════════════════════
// 🎮 MINI PREVIEWS
// ═══════════════════════════════════════════════
const MiniPreviewClasico = ({ tema }) => (
  <View style={{ height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25 }}>
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tema.accentDark }} />
      <View style={{ flexDirection: 'row', gap: 2 }}>
        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: tema.accentDark }} />
        <View style={{ width: 12 }} />
        <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: tema.accentDark }} />
      </View>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tema.accentDark }} />
    </View>
    <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: tema.accentDark }} />
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: tema.accent }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: tema.accent }} />
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: tema.accent }} />
      </View>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: tema.accent }} />
    </View>
  </View>
);

const MiniPreviewCarreras = ({ tema }) => (
  <View style={{ height: 80, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 30 }}>
    <View style={{ width: 70, height: 22, borderRadius: 11, backgroundColor: tema.accentDark, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: tema.accent }} />
    </View>
    <View style={{ width: 24, height: 55, borderRadius: 12, backgroundColor: tema.accentDark, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: tema.accent }} />
    </View>
  </View>
);

// ═══════════════════════════════════════════════
// 🎮 MOTOR 1: MANDO CLÁSICO
// ═══════════════════════════════════════════════
const MotorTactilMaestro = ({ onBotonPresionar, onBotonSoltar, onJoyMover, onJoyActivar, onJoyDesactivar, salirDelJuego, conectado, intVibracion, tema }) => {
  const panIzq = useRef(new Animated.ValueXY()).current;
  const panDer = useRef(new Animated.ValueXY()).current;
  const [ba, setBa] = useState({});
  const dedos = useRef({}); const hb = useRef({}); const cal = useRef(false);
  const enBI = useRef(false); const enBD = useRef(false);
  const enCI = useRef(true); const enCD = useRef(true);
  const kT = useRef(null); const [kP, setKP] = useState(false);

  const refs = {
    LT: useRef(null), LB: useRef(null), RT: useRef(null), RB: useRef(null),
    MENU: useRef(null), K: useRef(null), APPS: useRef(null),
    UP: useRef(null), DOWN: useRef(null), LEFT: useRef(null), RIGHT: useRef(null),
    Y: useRef(null), X: useRef(null), A: useRef(null), B: useRef(null),
    JOY_IZQ: useRef(null), JOY_DER: useRef(null),
  };

  const vib = useCallback((msBase) => {
    const mult = { suave: 0.5, medio: 1, fuerte: 1.5, apagado: 0 }[intVibracion] || 0;
    if (mult > 0) Vibration.vibrate(Math.floor(msBase * mult));
  }, [intVibracion]);

  const calibrar = useCallback(() => {
    setTimeout(() => {
      const ns = Object.keys(refs); let m = 0;
      ns.forEach(n => { const r = refs[n].current; if (r) r.measure((x, y, w, h, pX, pY) => {
        if (pX !== undefined && w > 0) { hb.current[n] = { x1: pX, y1: pY, x2: pX + w, y2: pY + h }; m++; if (m === ns.length) cal.current = true; }
      }); });
    }, 800);
  }, []);

  const buscar = (pX, pY) => {
    const h = hb.current;
    for (const n of ['LT','LB','RT','RB','MENU','K','APPS','UP','DOWN','LEFT','RIGHT','Y','X','A','B']) {
      const b = h[n]; if (b && pX >= b.x1 && pX <= b.x2 && pY >= b.y1 && pY <= b.y2) return { tipo: 'boton', nombre: n };
    }
    const jI = h['JOY_IZQ']; if (jI && pX >= jI.x1 && pX <= jI.x2 && pY >= jI.y1 && pY <= jI.y2) return { tipo: 'joyIzq' };
    const jD = h['JOY_DER']; if (jD && pX >= jD.x1 && pX <= jD.x2 && pY >= jD.y1 && pY <= jD.y2) return { tipo: 'joyDer' };
    return null;
  };

  const joyOc = (t) => { for (const id in dedos.current) if (dedos.current[id].tipo === t) return true; return false; };

  const procJoy = (pX, pY, c, pR, l) => {
    let dx = pX - c.x, dy = pY - c.y, dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > RADIO_JOYSTICK) { dx = (dx / dist) * RADIO_JOYSTICK; dy = (dy / dist) * RADIO_JOYSTICK; }
    pR.setValue({ x: dx, y: dy });
    const eB = dist >= RADIO_JOYSTICK, eC = dist <= ZONA_MUERTA;
    if (l === 'Izquierdo') { if (eB && !enBI.current) vib(40); if (eC !== enCI.current) vib(25); enBI.current = eB; enCI.current = eC; }
    else { if (eB && !enBD.current) vib(40); if (eC !== enCD.current) vib(25); enBD.current = eB; enCD.current = eC; }
    onJoyMover(l, parseFloat((dx / RADIO_JOYSTICK).toFixed(2)), parseFloat((dy / RADIO_JOYSTICK).toFixed(2)));
  };

  const resetJoy = (pR, l) => {
    Animated.spring(pR, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
    if (l === 'Izquierdo') { enBI.current = false; enCI.current = true; } else { enBD.current = false; enCD.current = true; }
    onJoyMover(l, 0, 0); onJoyDesactivar(l);
  };

  const tS = (e) => {
    if (!cal.current) return;
    for (const t of (e.nativeEvent.changedTouches || [e.nativeEvent])) {
      const { identifier: id, pageX: pX, pageY: pY } = t;
      const r = buscar(pX, pY); if (!r) continue;
      if (r.tipo === 'boton') {
        dedos.current[id] = { tipo: 'boton', nombre: r.nombre }; vib(35);
        setBa(p => ({ ...p, [r.nombre]: true })); onBotonPresionar(r.nombre);
        if (r.nombre === 'K') { setKP(true); kT.current = setTimeout(() => { vib(100); salirDelJuego(); }, K_HOLD_TIME); }
      } else if (r.tipo === 'joyIzq' && !joyOc('joyIzq')) {
        dedos.current[id] = { tipo: 'joyIzq', centro: { x: pX, y: pY } }; panIzq.setValue({ x: 0, y: 0 }); vib(25); onJoyActivar('Izquierdo');
      } else if (r.tipo === 'joyDer' && !joyOc('joyDer')) {
        dedos.current[id] = { tipo: 'joyDer', centro: { x: pX, y: pY } }; panDer.setValue({ x: 0, y: 0 }); vib(25); onJoyActivar('Derecho');
      }
    }
  };

  const tM = (e) => { for (const t of e.nativeEvent.touches) { const d = dedos.current[t.identifier]; if (!d) continue; if (d.tipo === 'joyIzq') procJoy(t.pageX, t.pageY, d.centro, panIzq, 'Izquierdo'); else if (d.tipo === 'joyDer') procJoy(t.pageX, t.pageY, d.centro, panDer, 'Derecho'); } };

  const tE = (e) => {
    for (const t of (e.nativeEvent.changedTouches || [e.nativeEvent])) {
      const d = dedos.current[t.identifier]; if (!d) continue;
      if (d.tipo === 'boton') {
        if (d.nombre === 'K') { if (kT.current) clearTimeout(kT.current); kT.current = null; setKP(false); }
        setBa(p => { const n = { ...p }; delete n[d.nombre]; return n; }); onBotonSoltar(d.nombre);
      } else if (d.tipo === 'joyIzq') { vib(20); resetJoy(panIzq, 'Izquierdo'); }
      else if (d.tipo === 'joyDer') { vib(20); resetJoy(panDer, 'Derecho'); }
      delete dedos.current[t.identifier];
    }
  };

  const btnAct = { backgroundColor: tema.btnActive, transform: [{ scale: 0.93 }], elevation: 25, shadowColor: tema.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 25 };
  const btnActS = { backgroundColor: tema.btnActiveSoft, transform: [{ scale: 0.93 }], elevation: 20, shadowColor: tema.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20 };

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }} onLayout={calibrar}>
      <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 100 }} pointerEvents="none">
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: conectado ? VERDE_CONEXION : '#FF4444' }} />
      </View>

      <View style={{ flex: 1 }} pointerEvents="none">
        <View ref={refs.LT} style={[{ position: 'absolute', backgroundColor: tema.btnBase, width: 80, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4, overflow: 'hidden', top: 10, left: 20 }, ba['LT'] && btnAct]}>
        <GlowInterno activo={!!ba['LT']} borderRadius={14} color={tema.glow} /><Text style={[{ color: tema.accent, fontWeight: 'bold', fontSize: 15 }, ba['LT'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>LT</Text>
      </View>
      <View ref={refs.LB} style={[{ position: 'absolute', backgroundColor: tema.btnBaseSoft, width: 65, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden', top: 10, left: 115 }, ba['LB'] && btnActS]} pointerEvents="none">
        <GlowInterno activo={!!ba['LB']} borderRadius={12} color={tema.glow} /><Text style={[{ color: tema.accent, fontWeight: 'bold', fontSize: 15 }, ba['LB'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>LB</Text>
      </View>
      <View ref={refs.RT} style={[{ position: 'absolute', backgroundColor: tema.btnBase, width: 80, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 4, overflow: 'hidden', top: 10, right: 20 }, ba['RT'] && btnAct]} pointerEvents="none">
        <GlowInterno activo={!!ba['RT']} borderRadius={14} color={tema.glow} /><Text style={[{ color: tema.accent, fontWeight: 'bold', fontSize: 15 }, ba['RT'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>RT</Text>
      </View>
      <View ref={refs.RB} style={[{ position: 'absolute', backgroundColor: tema.btnBaseSoft, width: 65, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden', top: 10, right: 115 }, ba['RB'] && btnActS]} pointerEvents="none">
        <GlowInterno activo={!!ba['LB']} borderRadius={12} color={tema.glow} /><Text style={[{ color: tema.accent, fontWeight: 'bold', fontSize: 15 }, ba['RB'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>RB</Text>
      </View>

      <View style={{ position: 'absolute', top: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22 }} pointerEvents="none">
        <View ref={refs.MENU} style={[{ backgroundColor: tema.btnBaseSoft, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, overflow: 'hidden' }, ba['MENU'] && btnActS]}>
          <GlowInterno activo={!!ba['MENU']} color={tema.glow} /><MaterialIcons name="view-headline" size={22} color={ba['MENU'] ? '#FFF' : tema.accent} />
        </View>
        <View style={{ overflow: 'visible' }}>
          <View ref={refs.K} style={[{ backgroundColor: tema.surface, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: tema.accentDark, elevation: 5, overflow: 'hidden' }, ba['K'] && { ...btnActS, borderColor: tema.glow }]}>
            <GlowInterno activo={!!ba['K']} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 20, fontWeight: 'bold' }, ba['K'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>K</Text>
          </View>
          <CirculoProgresoK activo={kP} color={tema.glow} />
        </View>
        <View ref={refs.APPS} style={[{ backgroundColor: tema.btnBaseSoft, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, overflow: 'hidden' }, ba['APPS'] && btnActS]}>
          <GlowInterno activo={!!ba['APPS']} color={tema.glow} /><MaterialIcons name="window" size={20} color={ba['APPS'] ? '#FFF' : tema.accent} />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 15, left: 25, alignItems: 'center' }} pointerEvents="none">
        <View ref={refs.UP} style={[{ width: 54, height: 54, backgroundColor: tema.btnBase, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, elevation: 4, overflow: 'hidden' }, ba['UP'] && btnAct]}>
          <GlowInterno activo={!!ba['UP']} borderRadius={15} color={tema.glow} /><MaterialIcons name="keyboard-arrow-up" size={36} color={ba['UP'] ? '#FFF' : tema.accent} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
          <View ref={refs.LEFT} style={[{ width: 54, height: 54, backgroundColor: tema.btnBase, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, elevation: 4, overflow: 'hidden' }, ba['LEFT'] && btnAct]}>
            <GlowInterno activo={!!ba['LEFT']} borderRadius={15} color={tema.glow} /><MaterialIcons name="keyboard-arrow-left" size={36} color={ba['LEFT'] ? '#FFF' : tema.accent} />
          </View>
          <View style={{ width: 50, height: 50 }} />
          <View ref={refs.RIGHT} style={[{ width: 54, height: 54, backgroundColor: tema.btnBase, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, elevation: 4, overflow: 'hidden' }, ba['RIGHT'] && btnAct]}>
            <GlowInterno activo={!!ba['RIGHT']} borderRadius={15} color={tema.glow} /><MaterialIcons name="keyboard-arrow-right" size={36} color={ba['RIGHT'] ? '#FFF' : tema.accent} />
          </View>
        </View>
        <View ref={refs.DOWN} style={[{ width: 54, height: 54, backgroundColor: tema.btnBase, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginHorizontal: 2, elevation: 4, overflow: 'hidden' }, ba['DOWN'] && btnAct]}>
          <GlowInterno activo={!!ba['DOWN']} borderRadius={15} color={tema.glow} /><MaterialIcons name="keyboard-arrow-down" size={36} color={ba['DOWN'] ? '#FFF' : tema.accent} />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 15, right: 25, alignItems: 'center' }} pointerEvents="none">
        <View ref={refs.Y} style={[{ width: 58, height: 58, backgroundColor: tema.btnBase, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, overflow: 'hidden' }, ba['Y'] && btnAct]}>
          <GlowInterno activo={!!ba['Y']} borderRadius={20} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 24, fontWeight: 'bold' }, ba['Y'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>Y</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
          <View ref={refs.X} style={[{ width: 58, height: 58, backgroundColor: tema.btnBase, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, overflow: 'hidden' }, ba['X'] && btnAct]}>
            <GlowInterno activo={!!ba['X']} borderRadius={20} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 24, fontWeight: 'bold' }, ba['X'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>X</Text>
          </View>
          <View style={{ width: 50, height: 50 }} />
          <View ref={refs.B} style={[{ width: 58, height: 58, backgroundColor: tema.btnBase, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, overflow: 'hidden' }, ba['B'] && btnAct]}>
            <GlowInterno activo={!!ba['B']} borderRadius={20} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 24, fontWeight: 'bold' }, ba['B'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>B</Text>
          </View>
        </View>
        <View ref={refs.A} style={[{ width: 58, height: 58, backgroundColor: tema.btnBase, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, overflow: 'hidden' }, ba['A'] && btnAct]}>
          <GlowInterno activo={!!ba['A']} borderRadius={20} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 24, fontWeight: 'bold' }, ba['A'] && { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } }]}>A</Text>
        </View>
      </View>

      <View ref={refs.JOY_IZQ} style={{ position: 'absolute', top: 70, left: 155 }} pointerEvents="none">
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: tema.surfaceDeep, borderWidth: 2, borderColor: tema.border, justifyContent: 'center', alignItems: 'center', elevation: 2 }}>
          <Animated.View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: tema.accentDark, elevation: 8, borderWidth: 1, borderColor: tema.accent, transform: [{ translateX: panIzq.x }, { translateY: panIzq.y }] }} />
        </View>
      </View>
      <View ref={refs.JOY_DER} style={{ position: 'absolute', bottom: 25, right: 200 }}>
        <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: tema.surfaceDeep, borderWidth: 2, borderColor: tema.border, justifyContent: 'center', alignItems: 'center', elevation: 2 }}>
          <Animated.View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: tema.accentDark, elevation: 8, borderWidth: 1, borderColor: tema.accent, transform: [{ translateX: panDer.x }, { translateY: panDer.y }] }} />
        </View>
      </View>
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} onTouchStart={tS} onTouchMove={tM} onTouchEnd={tE} onTouchCancel={tE} />
    </View>
  );
};

// ═══════════════════════════════════════════════
// 🏎️ MOTOR 2: CARRERAS
// ═══════════════════════════════════════════════
const MotorCarreras = ({ onBotonPresionar, onBotonSoltar, onJoyMover, enviarCustom, salirDelJuego, conectado, intVibracion, tema }) => {
  const panVol = useRef(new Animated.Value(0)).current;
  const panPed = useRef(new Animated.Value(0)).current;
  const [ba, setBa] = useState({});
  const dedos = useRef({}); const hb = useRef({}); const cal = useRef(false);
  const enBV = useRef({ i: false, d: false }); const enTP = useRef({ a: false, b: false });
  const kT = useRef(null); const [kP, setKP] = useState(false);
  const MAX_V = 90; const MAX_P = 95; const ZM_P = 18;

  const refs = { VOLANTE: useRef(null), PEDAL: useRef(null), A: useRef(null), B: useRef(null), K: useRef(null), MENU: useRef(null), APPS: useRef(null) };
  
  const vib = useCallback((msBase) => {
    const mult = { suave: 0.5, medio: 1, fuerte: 1.5, apagado: 0 }[intVibracion] || 0;
    if (mult > 0) Vibration.vibrate(Math.floor(msBase * mult));
  }, [intVibracion]);

  const calibrar = useCallback(() => {
    setTimeout(() => {
      const ns = Object.keys(refs); let m = 0;
      ns.forEach(n => { const r = refs[n].current; if (r) r.measure((x, y, w, h, pX, pY) => {
        if (pX !== undefined && w > 0) { hb.current[n] = { x1: pX, y1: pY, x2: pX + w, y2: pY + h, width: w, height: h }; m++; if (m === ns.length) cal.current = true; }
      }); });
    }, 800);
  }, []);

  const buscar = (pX, pY) => {
    const h = hb.current;
    if (h['VOLANTE'] && pX >= h['VOLANTE'].x1 && pX <= h['VOLANTE'].x2 && pY >= h['VOLANTE'].y1 && pY <= h['VOLANTE'].y2) return { tipo: 'volante' };
    if (h['PEDAL'] && pX >= h['PEDAL'].x1 && pX <= h['PEDAL'].x2 && pY >= h['PEDAL'].y1 && pY <= h['PEDAL'].y2) return { tipo: 'pedal' };
    for (const n of ['A', 'B', 'K', 'MENU', 'APPS']) { const b = h[n]; if (b && pX >= b.x1 && pX <= b.x2 && pY >= b.y1 && pY <= b.y2) return { tipo: 'boton', nombre: n }; }
    return null;
  };

  const procVol = (pX) => {
    const h = hb.current['VOLANTE']; const cX = h.x1 + (h.width / 2); let dx = pX - cX;
    if (dx <= -MAX_V && !enBV.current.i) vib(50); if (dx >= MAX_V && !enBV.current.d) vib(50);
    enBV.current = { i: dx <= -MAX_V, d: dx >= MAX_V };
    dx = Math.max(-MAX_V, Math.min(MAX_V, dx));
    panVol.setValue(dx); onJoyMover('Izquierdo', (dx / MAX_V).toFixed(2), 0);
  };

  const procPed = (pY) => {
    const h = hb.current['PEDAL']; const cY = h.y1 + (h.height / 2); let dy = pY - cY;
    if (dy <= -MAX_P && !enTP.current.a) vib(45); if (dy >= MAX_P && !enTP.current.b) vib(45);
    enTP.current = { a: dy <= -MAX_P, b: dy >= MAX_P };
    dy = Math.max(-MAX_P, Math.min(MAX_P, dy));
    panPed.setValue(dy);
    if (dy < -ZM_P) { const v = Math.min(1, Math.abs((dy + ZM_P) / (MAX_P - ZM_P))).toFixed(2); enviarCustom(`RT_ANA|${v}`); enviarCustom('LT_ANA|0.0'); }
    else if (dy > ZM_P) { const v = Math.min(1, Math.abs((dy - ZM_P) / (MAX_P - ZM_P))).toFixed(2); enviarCustom(`LT_ANA|${v}`); enviarCustom('RT_ANA|0.0'); }
    else { enviarCustom('RT_ANA|0.0'); enviarCustom('LT_ANA|0.0'); }
  };

  const tS = (e) => {
    if (!cal.current) return;
    for (const t of (e.nativeEvent.changedTouches || [e.nativeEvent])) {
      const res = buscar(t.pageX, t.pageY); if (!res) continue;
      if (res.tipo === 'boton') {
        dedos.current[t.identifier] = res; vib(35); setBa(p => ({ ...p, [res.nombre]: true })); onBotonPresionar(res.nombre);
        if (res.nombre === 'K') { setKP(true); kT.current = setTimeout(() => { vib(100); salirDelJuego(); }, K_HOLD_TIME); }
      } else if (res.tipo === 'volante') { dedos.current[t.identifier] = res; vib(20); procVol(t.pageX); }
      else if (res.tipo === 'pedal') { dedos.current[t.identifier] = res; vib(20); procPed(t.pageY); }
    }
  };

  const tM = (e) => { for (const t of e.nativeEvent.touches) { const d = dedos.current[t.identifier]; if (!d) continue; if (d.tipo === 'volante') procVol(t.pageX); else if (d.tipo === 'pedal') procPed(t.pageY); } };

  const tE = (e) => {
    for (const t of (e.nativeEvent.changedTouches || [e.nativeEvent])) {
      const d = dedos.current[t.identifier]; if (!d) continue;
      if (d.tipo === 'boton') {
        if (d.nombre === 'K') { if (kT.current) clearTimeout(kT.current); kT.current = null; setKP(false); }
        setBa(p => { const n = { ...p }; delete n[d.nombre]; return n; }); onBotonSoltar(d.nombre);
      } else if (d.tipo === 'volante') { vib(15); Animated.spring(panVol, { toValue: 0, friction: 5, useNativeDriver: false }).start(); onJoyMover('Izquierdo', 0, 0); enBV.current = { i: false, d: false }; }
      else if (d.tipo === 'pedal') { vib(15); Animated.spring(panPed, { toValue: 0, friction: 5, useNativeDriver: false }).start(); enviarCustom('RT_ANA|0.0'); enviarCustom('LT_ANA|0.0'); enTP.current = { a: false, b: false }; }
      delete dedos.current[t.identifier];
    }
  };

  const pedColor = panPed.interpolate({ inputRange: [-MAX_P, -ZM_P, 0, ZM_P, MAX_P], outputRange: [tema.glow, tema.glow, tema.accentDark, '#FF4444', '#FF4444'] });
  const btnAct = { backgroundColor: tema.btnActive, transform: [{ scale: 0.93 }], elevation: 25, shadowColor: tema.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 25 };
  const btnActS = { backgroundColor: tema.btnActiveSoft, transform: [{ scale: 0.93 }], elevation: 20, shadowColor: tema.glow, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20 };
  const tGlow = { color: '#FFF', textShadowColor: tema.glow, textShadowRadius: 15, textShadowOffset: { width: 0, height: 0 } };

  return (
    <View style={{ flex: 1, backgroundColor: tema.bg }} onLayout={calibrar}>
      <View style={{ position: 'absolute', top: 8, left: 0, right: 0, alignItems: 'center', zIndex: 100 }} pointerEvents="none">
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: conectado ? VERDE_CONEXION : '#FF4444' }} />
      </View>

      <View style={{ position: 'absolute', bottom: 130, left: 90, flexDirection: 'row', gap: 20 }} pointerEvents="none">
        <View ref={refs.MENU} style={[{ backgroundColor: tema.btnBaseSoft, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, overflow: 'hidden' }, ba['MENU'] && btnActS]}>
          <GlowInterno activo={!!ba['MENU']} color={tema.glow} /><MaterialIcons name="view-headline" size={20} color={ba['MENU'] ? '#FFF' : tema.accent} />
        </View>
        <View ref={refs.APPS} style={[{ backgroundColor: tema.btnBaseSoft, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4, overflow: 'hidden' }, ba['APPS'] && btnActS]}>
          <GlowInterno activo={!!ba['APPS']} color={tema.glow} /><MaterialIcons name="window" size={18} color={ba['APPS'] ? '#FFF' : tema.accent} />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 35, left: 15 }} pointerEvents="none">
        <View ref={refs.VOLANTE} style={{ width: 300, height: 80, borderRadius: 40, backgroundColor: tema.surface, borderWidth: 2, borderColor: tema.border, justifyContent: 'center', alignItems: 'center', elevation: 3 }}>
          <Animated.View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: tema.accentDark, elevation: 10, transform: [{ translateX: panVol }] }} />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 40, left: '50%', marginLeft: -32.5, alignItems: 'center' }} pointerEvents="none">
        <View ref={refs.B} style={[{ width: 58, height: 58, backgroundColor: tema.btnBase, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, overflow: 'hidden', marginBottom: 10 }, ba['B'] && btnAct]}>
          <GlowInterno activo={!!ba['B']} borderRadius={20} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 24, fontWeight: 'bold' }, ba['B'] && tGlow]}>B</Text>
        </View>
        <View ref={refs.A} style={[{ width: 58, height: 58, backgroundColor: tema.btnBase, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 5, overflow: 'hidden', marginBottom: 25 }, ba['A'] && btnAct]}>
          <GlowInterno activo={!!ba['A']} borderRadius={20} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 24, fontWeight: 'bold' }, ba['A'] && tGlow]}>A</Text>
        </View>
        <View style={{ overflow: 'visible' }}>
          <View ref={refs.K} style={[{ backgroundColor: tema.surface, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: tema.accentDark, elevation: 5, overflow: 'hidden' }, ba['K'] && { ...btnActS, borderColor: tema.glow }]}>
            <GlowInterno activo={!!ba['K']} color={tema.glow} /><Text style={[{ color: tema.accent, fontSize: 20, fontWeight: 'bold' }, ba['K'] && tGlow]}>K</Text>
          </View>
          <CirculoProgresoK activo={kP} color={tema.glow} />
        </View>
      </View>

      <View style={{ position: 'absolute', bottom: 15, right: 45 }} pointerEvents="none">
        <View ref={refs.PEDAL} style={{ width: 95, height: 260, borderRadius: 48, backgroundColor: tema.surface, borderWidth: 2, borderColor: tema.border, justifyContent: 'center', alignItems: 'center', elevation: 3, overflow: 'hidden' }}>
          <Animated.View style={{ width: 75, height: 75, borderRadius: 38, elevation: 10, backgroundColor: pedColor, transform: [{ translateY: panPed }] }} />
        </View>
      </View>

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} onTouchStart={tS} onTouchMove={tM} onTouchEnd={tE} onTouchCancel={tE} />
    </View>
  );
};

// ═══════════════════════════════════════════════
// 🌌 BACKGROUND GRADIENTE MESH
// ═══════════════════════════════════════════════
const MeshBackground = ({ tema }) => {
  const pan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pan, { toValue: 1, duration: 15000, useNativeDriver: true }),
        Animated.timing(pan, { toValue: 0, duration: 15000, useNativeDriver: true })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  
  const translateY = pan.interpolate({ inputRange: [0, 1], outputRange: [0, -150] });
  
  return (
    <Animated.View style={{ 
      position: 'absolute', width: '150%', height: '150%', 
      top: -50, left: -50, transform: [{ translateY }]
    }}>
      <LinearGradient 
        colors={[tema.surfaceDeep, tema.accentDark, tema.bg]} 
        style={StyleSheet.absoluteFillObject}
        start={{x: 0, y: 0}} end={{x: 1, y: 1}} 
      />
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════
// 📱 COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════
function MainApp() {
  const [estaConectado, setEstaConectado] = useState(false);
  const [estadoConexion, setEstadoConexion] = useState('desconectado');
  const [ipServidor, setIpServidor] = useState('');
  const [ipGuardada, setIpGuardada] = useState('');
  const [mostrarCampoIp, setMostrarCampoIp] = useState(true);
  const [pestanaActual, setPestanaActual] = useState('Inicio');
  const [modoJuego, setModoJuego] = useState('estandar');
  const [enMando, setEnMando] = useState(false);
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [temaActual, setTemaActual] = useState('verde');
  const [intensidadVibracion, setIntensidadVibracion] = useState('medio');
  const [slideAnim] = useState(new Animated.Value(0)); // Animación de slide
  
  // Multi-player: selector de jugador
  const [playerId, setPlayerId] = useState(1);
  const [connectedPlayers, setConnectedPlayers] = useState([]);
  
  // Función para cambiar de pestaña con animación
  const cambiarPestana = (nuevaPestana) => {
    if (nuevaPestana === pestanaActual) return;
    
    // Animación de slide
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Layout animation para transición suave
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPestanaActual(nuevaPestana);
  };
  
  const ws = useRef(null);
  const intencionDesconexion = useRef(false);
  const tema = TEMAS[temaActual];

  // <-- 3. USAMOS INSETS PARA SABER EL TAMAÑO DE LA BARRA DEL SISTEMA
  const insets = useSafeAreaInsets();

  useEffect(() => {
    async function init() {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      await NavigationBar.setVisibilityAsync('visible');
      try {
        const ip = await AsyncStorage.getItem('@kontrol_ip'); if (ip) { setIpServidor(ip); setIpGuardada(ip); setMostrarCampoIp(false); }
        const ob = await AsyncStorage.getItem('@kontrol_onboarding'); if (!ob) setMostrarOnboarding(true);
        const t = await AsyncStorage.getItem('@kontrol_tema'); if (t && TEMAS[t]) setTemaActual(t);
        const v = await AsyncStorage.getItem('@kontrol_vibracion'); if (v) setIntensidadVibracion(v);
      } catch (e) {}
      
      // Control exacto de 2 segundos para el Splash
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 2000);
    } init();
  }, []);

  const guardarTema = async (t) => { setTemaActual(t); try { await AsyncStorage.setItem('@kontrol_tema', t); } catch (e) {} };
  const guardarVibracion = async (val) => { setIntensidadVibracion(val); try { await AsyncStorage.setItem('@kontrol_vibracion', val); } catch (e) {} };

  const conectar = () => {
    const ip = ipServidor.trim(); if (!ip) return Alert.alert('IP necesaria', 'Escribe la IP de tu PC.');
    setEstadoConexion('conectando'); intencionDesconexion.current = false;
    setTimeout(() => {
      ws.current = new WebSocket(`ws://${ip}:5005`);
      
      // Handler para mensajes del servidor (confirmación de registro)
      ws.current.onmessage = (event) => {
        const msg = event.data;
        
        if (msg.startsWith('REGISTER_OK|')) {
          // Conexión aceptada
          const acceptedPlayerId = parseInt(msg.split('|')[1]);
          if (acceptedPlayerId === playerId) {
            setEstaConectado(true); setEstadoConexion('conectado'); 
            if (intensidadVibracion !== 'apagado') Vibration.vibrate(80);
            // Solo pedir lista DESPUÉS de confirmar conexión
            setTimeout(() => {
              if (ws.current?.readyState === WebSocket.OPEN) {
                ws.current.send('GET_PLAYERS');
              }
            }, 500);
          }
        } else if (msg.startsWith('REGISTER_ERROR|')) {
          // Conexión rechazada
          const parts = msg.split('|');
          const rejectedPlayerId = parseInt(parts[1]);
          const reason = parts[2] || 'UNKNOWN';
          
          if (rejectedPlayerId === playerId) {
            ws.current.close();
            setEstadoConexion('desconectado');
            if (reason === 'IN_USE') {
              Alert.alert('Jugador en uso', `El jugador P${playerId} ya está conectado. Selecciona otro jugador.`);
            } else {
              Alert.alert('Error de conexión', 'No se pudo conectar al servidor.');
            }
          }
        } else if (msg.startsWith('PLAYERS_LIST|')) {
          // Lista de jugadores conectados (excluir el player actual)
          const list = msg.replace('PLAYERS_LIST|', '').split(',').map(Number).filter(n => !isNaN(n) && n !== playerId);
          setConnectedPlayers(list);
        }
      };
      
      ws.current.onopen = async () => { 
        try { await AsyncStorage.setItem('@kontrol_ip', ip); setIpGuardada(ip); setMostrarCampoIp(false); } catch (e) {} 
        // Enviar registro con player_id
        ws.current.send(`REGISTER|${playerId}`);
        // NO pedir lista aquí - se pide después de confirmar
      };
      
      ws.current.onerror = () => { setEstadoConexion('desconectado'); setEstaConectado(false); Alert.alert('Error', 'Verifica servidor e IP.'); };
      ws.current.onclose = () => { if (!intencionDesconexion.current && estaConectado) reconectar(0); else { setEstaConectado(false); setEstadoConexion('desconectado'); } };
    }, 2000);
  };

  const reconectar = (i) => {
    if (i >= 3) { setEstaConectado(false); setEstadoConexion('desconectado'); if (enMando) salirDelMando(); return; }
    setTimeout(() => {
      ws.current = new WebSocket(`ws://${ipServidor.trim()}:5005`);
      ws.current.onopen = () => { setEstaConectado(true); setEstadoConexion('conectado'); };
      ws.current.onerror = () => reconectar(i + 1);
      ws.current.onclose = () => { if (!intencionDesconexion.current) reconectar(i + 1); };
    }, 1500);
  };

  const desconectar = () => { intencionDesconexion.current = true; if (ws.current) ws.current.close(); setEstaConectado(false); setEstadoConexion('desconectado'); };
  const toggleConexion = () => { if (estadoConexion === 'conectado') desconectar(); else if (estadoConexion === 'desconectado') conectar(); };

  const entrarAlMando = async (modo) => { setModoJuego(modo); await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE); await NavigationBar.setVisibilityAsync('hidden'); setEnMando(true); };
  const salirDelMando = async () => { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT); await NavigationBar.setVisibilityAsync('visible'); setEnMando(false); };

  // Multi-player: enviar con prefijo player_id
  const enviar = useCallback((msg) => { 
    if (ws.current?.readyState === WebSocket.OPEN) {
      // Añadir prefijo player_id si el mensaje no lo tiene ya
      if (!msg.startsWith(playerId + '|') && !msg.startsWith('REGISTER|')) {
        ws.current.send(`${playerId}|${msg}`);
      } else {
        ws.current.send(msg);
      }
    }
  }, [playerId]);
  const enviarCustom = useCallback((cmd) => enviar(cmd), [enviar]);
  const handleMoverJoy = useCallback((l, x, y) => enviar(`JOY_${l.toUpperCase()}|${x}|${y}`), [enviar]);

  if (mostrarOnboarding) return <PantallaOnboarding tema={tema} onTerminar={() => setMostrarOnboarding(false)} />;

  if (enMando) return (
    <View style={{ flex: 1, backgroundColor: tema.bg }}>
      <StatusBar hidden={true} />
      {modoJuego === 'estandar' ? (
        <MotorTactilMaestro onBotonPresionar={n => enviar(`${n}_PRESIONADO`)} onBotonSoltar={n => enviar(`${n}_SOLTADO`)}
          onJoyMover={handleMoverJoy} onJoyActivar={l => enviar(`JOY_${l.toUpperCase()}_PRESIONADO`)}
          onJoyDesactivar={l => enviar(`JOY_${l.toUpperCase()}_SOLTADO`)} salirDelJuego={salirDelMando}
          conectado={estaConectado} intVibracion={intensidadVibracion} tema={tema} />
      ) : (
        <MotorCarreras onBotonPresionar={n => enviar(`${n}_PRESIONADO`)} onBotonSoltar={n => enviar(`${n}_SOLTADO`)}
          onJoyMover={handleMoverJoy} enviarCustom={enviarCustom} salirDelJuego={salirDelMando}
          conectado={estaConectado} intVibracion={intensidadVibracion} tema={tema} />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, width: '100%', backgroundColor: tema.bg }}>
      <StatusBar style="light" hidden={false} translucent={true} backgroundColor="transparent" />
      
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <View style={{ flex: 1, paddingHorizontal: MARGIN_LATERAL }}>

          {/* ═══ INICIO ═══ */}
          {pestanaActual === 'Inicio' && (
            <ScrollView style={{ flex: 1, marginTop: 15 }} showsVerticalScrollIndicator={false}>
              <IndicadorConexion conectado={estaConectado} estilo={{ marginBottom: 20 }} />
              
              <Text style={{ fontSize: 14, color: tema.accentDark, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 }}>DISEÑOS DISPONIBLES</Text>
              
              {/* Game Mode Cards - Material Polish without cut-off shadows */}
              <TouchableOpacity
                onPress={() => entrarAlMando('estandar')}
                activeOpacity={0.8}
                style={{ 
                  width: '100%', 
                  borderRadius: 24, 
                  marginBottom: 16, 
                  overflow: 'hidden',
                }}
              >
                <View style={{ backgroundColor: tema.surface, borderRadius: 24, padding: 18, borderWidth: 1.5, borderColor: tema.border }}>
                  <View style={{ backgroundColor: tema.bg, borderRadius: 18, marginBottom: 12, overflow: 'hidden' }}>
                    <MiniPreviewClasico tema={tema} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: tema.text }}>Mando Clásico</Text>
                    <MaterialIcons name="arrow-forward" size={22} color={tema.glow} />
                  </View>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => entrarAlMando('carreras')}
                activeOpacity={0.8}
                style={{ 
                  width: '100%', 
                  borderRadius: 24, 
                  marginBottom: 20, 
                  overflow: 'hidden',
                }}
              >
                <View style={{ backgroundColor: tema.surface, borderRadius: 24, padding: 18, borderWidth: 1.5, borderColor: tema.border }}>
                  <View style={{ backgroundColor: tema.bg, borderRadius: 18, marginBottom: 12, overflow: 'hidden' }}>
                    <MiniPreviewCarreras tema={tema} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: tema.text }}>Carreras Pro</Text>
                    <MaterialIcons name="arrow-forward" size={22} color={tema.glow} />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* ═══ CONEXIÓN ═══ */}
          {pestanaActual === 'Conectar' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={{ flex: 1, width: '100%' }}>
              <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', width: '100%', paddingBottom: 60 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <BotonPower estado={estadoConexion} onPress={toggleConexion} />
                
                {/* SELECTOR DE JUGADOR */}
                <View style={{ marginTop: 30, alignItems: 'center', width: '100%' }}>
                  {estadoConexion === 'conectando' ? (
                    // Skeleton loader mientras conecta
                    <View style={{ alignItems: 'center' }}>
                      <SkeletonLoader width={150} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[1, 2, 3, 4].map((num) => (
                          <SkeletonLoader key={num} width={56} height={56} borderRadius={28} />
                        ))}
                      </View>
                    </View>
                  ) : (
                    // Selector normal
                    <>
                      <Text style={{ color: tema.accent, fontSize: 14, fontWeight: '600', marginBottom: 12 }}>SELECCIONA TU JUGADOR</Text>
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        {[1, 2, 3, 4].map((num) => {
                          const isSelected = playerId === num;
                          const isTaken = connectedPlayers.includes(num);
                          return (
                            <TouchableOpacity
                              key={num}
                              onPress={() => setPlayerId(num)}
                              disabled={estadoConexion === 'conectando' || estadoConexion === 'conectado' || (isTaken && !isSelected)}
                              style={{
                                width: 56, height: 56, borderRadius: 28,
                                backgroundColor: isSelected ? tema.glow : tema.surface,
                                borderWidth: 2,
                                borderColor: isSelected ? tema.glow : tema.accentDark,
                                justifyContent: 'center', alignItems: 'center',
                                opacity: (isTaken && !isSelected) ? 0.3 : ((estadoConexion === 'conectando' || estadoConexion === 'conectado') ? 0.5 : 1),
                              }}
                            >
                              <Text style={{ 
                                color: isSelected ? tema.bg : (isTaken ? tema.accentDark : tema.text), 
                                fontSize: 24, fontWeight: 'bold' 
                              }}>{num}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </>
                  )}
                  {connectedPlayers.includes(playerId) && estadoConexion !== 'conectado' && (
                    <Text style={{ color: '#FF4444', fontSize: 12, marginTop: 8 }}>Este jugador ya está en uso</Text>
                  )}
                </View>

                <View style={{ marginTop: 30, alignItems: 'center', width: '100%' }}>
                  {!mostrarCampoIp && ipGuardada ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: tema.accent, fontSize: 16, fontWeight: '600' }}>{estadoConexion === 'conectado' ? `Conectado como P${playerId} a` : 'Conectar a'} {ipGuardada}</Text>
                      <TouchableOpacity onPress={() => setMostrarCampoIp(true)} style={{ marginTop: 10 }}>
                        <Text style={{ color: tema.accentDark, fontSize: 14, textDecorationLine: 'underline' }}>¿Cambiar IP?</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', width: '100%', paddingHorizontal: 20 }}>
                      <TextInput style={{ width: '100%', backgroundColor: tema.surface, color: tema.text, fontSize: 18, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: tema.accentDark, textAlign: 'center' }}
                        placeholder="Ej. 192.168.1.50" placeholderTextColor={tema.accent + '60'} value={ipServidor} onChangeText={setIpServidor} keyboardType="numeric" />
                      {ipGuardada !== '' && <TouchableOpacity onPress={() => { setMostrarCampoIp(false); setIpServidor(ipGuardada); }} style={{ marginTop: 8 }}><Text style={{ color: tema.accentDark, fontSize: 14, textDecorationLine: 'underline' }}>Cancelar</Text></TouchableOpacity>}
                    </View>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* ═══ AJUSTES ═══ */}
          {pestanaActual === 'Configuracion' && (
            <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
              
              <Text style={{ fontSize: 18, color: tema.accent, fontWeight: 'bold', marginBottom: 15 }}>Preferencias</Text>
              
              {/* SELECTOR DE VIBRACIÓN */}
              <View style={{ backgroundColor: tema.surface, borderRadius: 15, padding: 15, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 }}>
                  <MaterialIcons name="vibration" size={24} color={tema.accent} />
                  <View>
                    <Text style={{ color: tema.text, fontSize: 16, fontWeight: 'bold' }}>Intensidad de Vibración</Text>
                    <Text style={{ color: tema.accent, fontSize: 12 }}>Feedback háptico al tocar</Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', backgroundColor: tema.bg, borderRadius: 10, overflow: 'hidden' }}>
                  {['apagado', 'suave', 'medio', 'fuerte'].map((nivel) => (
                    <TouchableOpacity
                      key={nivel}
                      onPress={() => guardarVibracion(nivel)}
                      style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: intensidadVibracion === nivel ? tema.accentDark : 'transparent' }}
                    >
                      <Text style={{ color: intensidadVibracion === nivel ? '#FFF' : tema.accent, fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {nivel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* TEMAS */}
              <Text style={{ fontSize: 18, color: tema.accent, fontWeight: 'bold', marginBottom: 15, marginTop: 25 }}>Tema de Color</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }}>
                {Object.keys(TEMAS).map(k => {
                  const isActive = temaActual === k;
                  const itemWidth = (SCREEN_WIDTH - (MARGIN_LATERAL * 2) - 46) / 4;
                  return (
                    <TouchableOpacity
                      key={k}
                      onPress={() => {
                        if (intensidadVibracion !== 'apagado') Vibration.vibrate(40);
                        guardarTema(k);
                      }}
                      activeOpacity={0.8}
                      style={{
                        width: itemWidth, height: itemWidth, borderRadius: 18,
                        backgroundColor: isActive ? TEMAS[k].glow + '20' : tema.surface,
                        borderWidth: isActive ? 3 : 1.5,
                        borderColor: isActive ? TEMAS[k].glow : tema.border,
                        justifyContent: 'center', alignItems: 'center',
                        transform: [{ scale: isActive ? 1.05 : 1 }]
                      }}
                    >
                      <View style={{ width: '40%', aspectRatio: 1, borderRadius: 999, backgroundColor: TEMAS[k].glow, elevation: 4 }}>
                        {isActive && (
                          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <MaterialIcons name="check" size={itemWidth * 0.25} color={TEMAS[k].bg} />
                          </View>
                        )}
                      </View>
                      <Text style={{ 
                        color: isActive ? tema.text : TEMAS[k].accent, 
                        fontSize: 10, marginTop: 4, fontWeight: 'bold' 
                      }}>{TEMAS[k].nombre}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SEPARADOR */}
              <View style={{ height: 1, backgroundColor: tema.border, marginVertical: 25 }} />

              {/* SOPORTE */}
              <Text style={{ fontSize: 18, color: tema.accent, fontWeight: 'bold', marginBottom: 15 }}>Soporte</Text>

              <TouchableOpacity
                onPress={() => Linking.openURL(FEEDBACK_URL)}
                variant="secondary"
                style={{ marginBottom: 10 }}
              >
                <View style={{ backgroundColor: tema.surface, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="feedback" size={24} color={tema.accent} />
                  <View>
                    <Text style={{ color: tema.text, fontSize: 16, fontWeight: 'bold' }}>Enviar Feedback</Text>
                    <Text style={{ color: tema.accent, fontSize: 12 }}>Reportar bugs o sugerencias</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* SEPARADOR */}
              <View style={{ height: 1, backgroundColor: tema.border, marginVertical: 25 }} />

              {/* LEGAL */}
              <Text style={{ fontSize: 18, color: tema.accent, fontWeight: 'bold', marginBottom: 15 }}>Legal</Text>

              <TouchableOpacity
                onPress={() => Linking.openURL(PRIVACY_URL)}
                variant="secondary"
                style={{ marginBottom: 10 }}
              >
                <View style={{ backgroundColor: tema.surface, borderRadius: 15, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="shield" size={24} color={tema.accent} />
                  <Text style={{ color: tema.text, fontSize: 16 }}>Política de Privacidad</Text>
                </View>
              </TouchableOpacity>

              {/* SEPARADOR */}
              <View style={{ height: 1, backgroundColor: tema.border, marginVertical: 25 }} />

              {/* CHANGELOG */}
              <Text style={{ fontSize: 18, color: tema.accent, fontWeight: 'bold', marginBottom: 15 }}>Registro de Cambios</Text>
              <View style={{ backgroundColor: tema.surface, borderRadius: 15, padding: 15, marginBottom: 10 }}>
                {CHANGELOG.map((item, idx) => (
                  <View key={item.v} style={{ marginBottom: idx === CHANGELOG.length - 1 ? 0 : 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={{ color: tema.glow, fontSize: 14, fontWeight: 'bold' }}>v{item.v}</Text>
                      <Text style={{ color: tema.accent, fontSize: 12 }}>{item.t}</Text>
                    </View>
                    {item.d.map((desc, i) => (
                      <View key={i} style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
                        <Text style={{ color: tema.glow, fontSize: 12 }}>•</Text>
                        <Text style={{ color: tema.accent, fontSize: 12, flex: 1 }}>{desc}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>

              {/* SEPARADOR */}
              <View style={{ height: 1, backgroundColor: tema.border, marginVertical: 25 }} />

              {/* ABOUT (KONTROL LOGO) */}
              <View style={{ padding: 20, alignItems: 'center', marginBottom: 15 }}>
                <View style={{ 
                  width: 132, height: 132, borderRadius: 36, 
                  backgroundColor: tema.surfaceDeep, 
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 1.5, borderColor: tema.border,
                  elevation: 10, shadowColor: tema.glow, shadowOpacity: 0.15, shadowRadius: 15
                }}>
                  <Image 
                    source={require('./assets/android-icon-foreground.png')} 
                    style={{ width: 120, height: 120 }} 
                    resizeMode="contain" 
                    resizeMethod="resize"
                  />
                </View>
                <Text style={{ color: tema.text, fontSize: 24, fontWeight: 'bold', marginTop: 15 }}>KONTROL</Text>
                <Text style={{ color: tema.accent, fontSize: 14, marginTop: 5 }}>Versión {APP_VERSION}</Text>
                <View style={{ height: 1, backgroundColor: tema.border, width: '80%', marginVertical: 15 }} />
                <Text style={{ color: tema.accent, fontSize: 13, textAlign: 'center' }}>Gamepad virtual para PC vía WiFi</Text>
                <Text style={{ color: tema.accentDark, fontSize: 12, marginTop: 10 }}>© 2026 KeythDzng</Text>
              </View>

              {/* UTILIDADES */}
              <TouchableOpacity
                onPress={async () => {
                  await AsyncStorage.removeItem('@kontrol_ip'); setIpGuardada(''); setIpServidor(''); setMostrarCampoIp(true);
                  Alert.alert('Listo', 'IP eliminada.');
                }}
                variant="secondary"
                style={{ marginBottom: 10 }}
              >
                <View style={{ backgroundColor: tema.surface, borderRadius: 15, padding: 15, alignItems: 'center' }}>
                  <Text style={{ color: '#FF4444', fontWeight: 'bold' }}>Olvidar IP Guardada</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMostrarOnboarding(true)}
                variant="secondary"
                style={{ marginBottom: 10 }}
              >
                <View style={{ backgroundColor: tema.surface, borderRadius: 15, padding: 15, alignItems: 'center' }}>
                  <Text style={{ color: tema.accent, fontWeight: 'bold' }}>Ver Tutorial Inicial</Text>
                </View>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>

        {/* BARRA NAV */}
        <View style={{ width: '100%', flexDirection: 'row', backgroundColor: tema.surface, paddingBottom: Math.max(25, insets.bottom + 10), paddingTop: 10, borderTopWidth: 1, borderTopColor: tema.border }}>
          {[{ id: 'Inicio', icon: 'home', label: 'Inicio' }, { id: 'Conectar', icon: 'power-settings-new', label: 'Conexión' }, { id: 'Configuracion', icon: 'settings', label: 'Ajustes' }].map(tab => {
            const isActive = pestanaActual === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => cambiarPestana(tab.id)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{ 
                    width: isActive ? 32 : 0, 
                    height: 3, 
                    backgroundColor: tema.glow, 
                    borderRadius: 2,
                    marginBottom: 4,
                    shadowColor: tema.glow, shadowOpacity: isActive ? 0.8 : 0, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: isActive ? 5 : 0
                  }} />
                  <View style={isActive ? { shadowColor: tema.glow, shadowOpacity: 0.7, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } } : {}}>
                    <MaterialIcons 
                      name={tab.icon} 
                      size={28} 
                      color={isActive ? tema.glow : tema.accentDark}
                    />
                  </View>
                  {tab.id === 'Conectar' && estaConectado && <View style={{ position: 'absolute', top: -2, right: -4, width: 8, height: 8, borderRadius: 4, backgroundColor: VERDE_CONEXION }} />}
                </View>
                <Text style={{ 
                  fontSize: 11, 
                  marginTop: 2, 
                  fontWeight: isActive ? 'bold' : 'normal', 
                  color: isActive ? tema.glow : tema.accentDark 
                }}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// App export simple con SafeArea
export default function App() {
  console.log('[KONTROL] Inicializando app...');
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}