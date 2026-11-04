import React, { useRef, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../shared/store/LanguageContext';

interface Props {
  route: any;
  fabBottom: number;
  insetsTop: number;
  onOpenSheet: () => void;
}

export function DraggableTripPill({ route, fabBottom, insetsTop, onOpenSheet }: Props) {
  const { t } = useLanguage();
  const [pillPos, setPillPos] = useState<{ left: number; top: number } | null>(null);
  const pillPosRef = useRef<{ left: number; top: number } | null>(null);
  const pillStartRef = useRef<{ left: number; top: number } | null>(null);
  const pillSizeRef = useRef({ w: 210, h: 44 });
  const pillRef = useRef<any>(null);

  const dragPillPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
        onPanResponderGrant: () => {
          pillStartRef.current = pillPosRef.current ? { ...pillPosRef.current } : null;
        },
        onPanResponderMove: (_, g) => {
          const start = pillStartRef.current;
          if (!start) return;
          const { w, h } = pillSizeRef.current;
          const screenW = Dimensions.get('window').width;
          const screenH = Dimensions.get('window').height;
          const left = Math.max(8, Math.min(screenW - w - 8, start.left + g.dx));
          const top = Math.max(
            insetsTop + 72,
            Math.min(screenH - 100 - h, start.top + g.dy)
          );
          const next = { left: Math.round(left), top: Math.round(top) };
          pillPosRef.current = next;
          setPillPos(next);
        },
      }),
    [insetsTop]
  );

  return (
    <View
      style={
        pillPos
          ? [styles.expandSheetWrapPos, { left: pillPos.left, top: pillPos.top }]
          : [styles.expandSheetWrap, { bottom: fabBottom }]
      }
      {...dragPillPan.panHandlers}
    >
      <TouchableOpacity
        ref={pillRef}
        style={styles.expandSheetFab}
        onPress={onOpenSheet}
        activeOpacity={0.85}
        onLayout={e => {
          const { width, height } = e.nativeEvent.layout;
          pillSizeRef.current = { w: Math.round(width), h: Math.round(height) };
          if (!pillPosRef.current) {
            requestAnimationFrame(() => {
              pillRef.current?.measureInWindow((mx: number, my: number) => {
                if (mx == null || my == null || pillPosRef.current) return;
                const p = { left: Math.round(mx), top: Math.round(my) };
                pillPosRef.current = p;
                setPillPos(p);
              });
            });
          }
        }}
      >
        <Ionicons name="chevron-up" size={18} color="#16a34a" />
        <Text style={styles.expandSheetFabText}>
          {route?.duration?.text ? `${route.duration.text} · ${t('planRoute.viewRoute')}` : t('planRoute.viewRoute')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  expandSheetWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },
  expandSheetWrapPos: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 95,
  },
  expandSheetFab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e6f4ea',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  expandSheetFabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
});
