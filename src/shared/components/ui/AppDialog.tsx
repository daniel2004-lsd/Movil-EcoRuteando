// src/shared/components/ui/AppDialog.tsx
// Diálogo/alerta propio de EcoRuteando: reemplaza a Alert.alert (que es gris y
// del sistema) por un modal con el mismo estilo del dashboard: tarjeta blanca
// redondeada (24), borde suave, icono circular de color y botones con el verde
// ecológico #10b981. Soporta modo oscuro.
//
// Uso (sin hooks, se puede llamar desde cualquier parte):
//   import { Dialog } from '.../AppDialog';
//   Dialog.alert(t('titulo'), t('mensaje'));                       // OK
//   Dialog.alert(t('titulo'), t('msg'), [{ text: 'Cancelar', style: 'cancel' }, { text: 'Aceptar', onPress }]);
//   Dialog.alert(t('titulo'), t('msg'), [{ text: 'OK' }], { tone: 'success' });
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../store/ThemeContext';

export type DialogTone = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

export type DialogOptions = {
  tone?: DialogTone;
  /** Icono de Ionicons que sobrescribe el del tono. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Si es false, tocar fuera del modal no lo cierra (por defecto true). */
  cancelable?: boolean;
};

type DialogItem = {
  title: string;
  message?: string;
  buttons: DialogButton[];
  options: DialogOptions;
};

/* --------------------------- cola + singleton --------------------------- */
const queue: DialogItem[] = [];
let listener: (() => void) | null = null;

function notify() {
  listener?.();
}

/**
 * API compatible con `Alert.alert(titulo, mensaje, botones, opciones)`.
 * También admite las opciones sin botones: `Dialog.alert(t, m, { tone: 'error' })`.
 * Se registra sola cuando <DialogProvider /> monta en app/_layout.tsx.
 */
export const Dialog = {
  alert(
    title: string,
    message?: string,
    buttonsOrOptions?: DialogButton[] | DialogOptions,
    options?: DialogOptions
  ): void {
    // Acepta las opciones en 3ª o en 4ª posición: así `Dialog.alert(t, m, { tone })`
    // y `Dialog.alert(t, m, botones, { tone })` funcionan igual.
    let buttons: DialogButton[] | undefined;
    let opts: DialogOptions | undefined;
    if (Array.isArray(buttonsOrOptions)) {
      buttons = buttonsOrOptions;
      opts = options;
    } else if (buttonsOrOptions && typeof buttonsOrOptions === 'object') {
      opts = buttonsOrOptions;
    } else {
      opts = options;
    }
    queue.push({
      title,
      message: message ?? '',
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      options: opts ?? {},
    });
    notify();
  },
};

const DialogContext = createContext<typeof Dialog>(Dialog);

export function useDialog() {
  return useContext(DialogContext);
}

/* -------------------------------- tonos --------------------------------- */
const TONE: Record<DialogTone, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
  error: { icon: 'close-circle', color: '#ef4444', bg: 'rgba(239,68,68,0.14)' },
  warning: { icon: 'alert-circle', color: '#f59e0b', bg: 'rgba(245,158,11,0.14)' },
  info: { icon: 'information-circle', color: '#06b6d4', bg: 'rgba(6,182,214,0.14)' },
  confirm: { icon: 'help-circle', color: '#10b981', bg: 'rgba(16,185,129,0.14)' },
};

/** Tono automático: si el botón es destructivo → rojo con papelera. */
function resolveTone(item: DialogItem): DialogTone {
  if (item.options.tone) return item.options.tone;
  if (item.buttons.some(b => b.style === 'destructive')) return 'error';
  if (item.buttons.length > 1 && item.buttons.some(b => b.style === 'cancel')) return 'confirm';
  return 'success';
}

/* ------------------------------- provider ------------------------------- */
export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeMode();
  const isDark = theme === 'dark';

  const [item, setItem] = useState<DialogItem | null>(null);
  const [visible, setVisible] = useState(false);
  const itemRef = useRef<DialogItem | null>(null);
  // Mientras está cerrando no se saca nada de la cola: evita que la siguiente
  // alerta aparezca en mitad del fundido de la anterior (parpadeo).
  const busyRef = useRef(false);
  const anim = useRef(new Animated.Value(0)).current;

  /** Saca el siguiente de la cola solo si no hay uno abierto. */
  const pump = useCallback(() => {
    if (busyRef.current || itemRef.current) return;
    const next = queue.shift();
    if (!next) return;
    itemRef.current = next;
    setItem(next);
    setVisible(true);
  }, []);

  useEffect(() => {
    listener = pump;
    pump();
    return () => {
      if (listener === pump) listener = null;
    };
  }, [pump]);

  // Animación de entrada de la tarjeta.
  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, anim]);

  const dismiss = useCallback(
    (onPress?: () => void) => {
      if (busyRef.current || !itemRef.current) return;
      busyRef.current = true;
      setVisible(false);
      setTimeout(() => {
        itemRef.current = null;
        setItem(null);
        try {
          onPress?.();
        } catch {
          /* un onPress que falla no debe romper la cola */
        }
        busyRef.current = false;
        setTimeout(pump, 140);
      }, 190);
    },
    [pump]
  );

  /** Tocar fuera: primero el botón «cancel», si no existe solo se cierra. */
  const handleBackdrop = useCallback(() => {
    const current = itemRef.current;
    if (!current) return;
    if (current.options.cancelable === false) return;
    const cancel = current.buttons.find(b => b.style === 'cancel');
    if (cancel) dismiss(cancel.onPress);
    else dismiss();
  }, [dismiss]);

  const toneKey = item ? resolveTone(item) : 'success';
  const tone = TONE[toneKey];
  // Botón destructivo (eliminar…) → papelera, salvo que se pida otro icono.
  const destructive = !!item && item.buttons.some(b => b.style === 'destructive');
  const icon = item?.options.icon ?? (destructive ? 'trash' : tone.icon);
  const stacked = !!item && item.buttons.length > 2;

  return (
    <DialogContext.Provider value={Dialog}>
      {children}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleBackdrop}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={handleBackdrop}
          accessibilityViewIsModal
        >
          <Animated.View
            style={[
              s.card,
              isDark && s.cardDark,
              {
                opacity: anim,
                transform: [
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) },
                  { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
                ],
              },
            ]}
          >
            {/* La tarjeta se traga los toques para que no cierren el modal */}
            <TouchableOpacity activeOpacity={1} onPress={() => {}} style={s.cardInner}>
              <View style={[s.iconWrap, { backgroundColor: tone.bg }]}>
                <Ionicons name={icon} size={30} color={tone.color} />
              </View>

              {!!item?.title && (
                <Text style={[s.title, isDark && { color: '#e2e8f0' }]} numberOfLines={3}>
                  {item.title}
                </Text>
              )}

              {!!item?.message && (
                <Text style={[s.message, isDark && { color: '#94a3b8' }]}>{item.message}</Text>
              )}

              <View style={[stacked ? s.btnCol : s.btnRow, isDark && s.btnRowDark]}>
                {item?.buttons.map((b, i) => {
                  const isCancel = b.style === 'cancel';
                  const isDanger = b.style === 'destructive';
                  const bgStyle = isDanger
                    ? isDark
                      ? s.btnDangerDark
                      : s.btnDanger
                    : isCancel
                      ? isDark
                        ? s.btnCancelDark
                        : s.btnCancel
                      : isDark
                        ? s.btnPrimaryDark
                        : s.btnPrimary;
                  const textStyle = isDanger
                    ? s.btnDangerText
                    : isCancel
                      ? isDark
                        ? s.btnCancelTextDark
                        : s.btnCancelText
                      : s.btnPrimaryText;
                  return (
                    <TouchableOpacity
                      key={`${b.text}-${i}`}
                      style={[s.btn, bgStyle, stacked && s.btnStacked]}
                      activeOpacity={0.8}
                      onPress={() => dismiss(b.onPress)}
                    >
                      <Text style={[s.btnText, textStyle]} numberOfLines={1}>
                        {b.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </DialogContext.Provider>
  );
}

/* -------------------------------- estilos -------------------------------- */
const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.50)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
  cardDark: { backgroundColor: '#162329', borderColor: '#26383D', shadowColor: '#000000' },
  cardInner: { borderRadius: 24, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 4 },
  iconWrap: {
    alignSelf: 'center',
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    marginTop: 14,
  },
  message: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  btnRowDark: { borderTopColor: '#26383D' },
  btnCol: { flexDirection: 'column', gap: 10, marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  btnStacked: { flex: undefined, width: '100%' },
  btnPrimary: { backgroundColor: '#10b981' },
  btnPrimaryDark: { backgroundColor: '#059669' },
  btnPrimaryText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnCancel: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  btnCancelDark: { backgroundColor: '#1f2937', borderWidth: 1, borderColor: '#374151' },
  btnCancelText: { color: '#4b5563', fontWeight: '700', fontSize: 14 },
  btnCancelTextDark: { color: '#cbd5e1', fontWeight: '700', fontSize: 14 },
  btnDanger: { backgroundColor: '#ef4444' },
  btnDangerDark: { backgroundColor: '#dc2626' },
  btnDangerText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  btnText: { fontSize: 14, textAlign: 'center' },
});
