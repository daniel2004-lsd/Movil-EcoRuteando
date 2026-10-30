// app/(tabs)/index.tsx — igual que web UserDashboard.jsx
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import apiClient from '../../src/shared/services/apiClient';
import * as SecureStore from '../../src/shared/services/keyStorage';
import { Dialog } from '../../src/shared/components/ui/AppDialog';

const MODULES = [
  { id:'plan_ruta', icon:'map', titleKey:'home.modPlan', subKey:'home.modPlanSub', colors:['#10b981','#059669'] },
  { id:'mis_rutas', icon:'navigate', titleKey:'home.modRoutes', subKey:'home.modRoutesSub', colors:['#06b6d4','#0284c7'] },
  { id:'historial', icon:'time', titleKey:'home.modHistory', subKey:'home.modHistorySub', colors:['#a855f7','#7c3aed'] },
  { id:'perfil', icon:'person', titleKey:'home.modProfile', subKey:'home.modProfileSub', colors:['#14b8a6','#0891b2'] },
  { id:'alertas', icon:'warning', titleKey:'home.modAlerts', subKey:'home.modAlertsSub', colors:['#f59e0b','#ea580c'] },
  { id:'stats', icon:'stats-chart', titleKey:'home.seeStats', subKey:'home.impactCardTitle', colors:['#10b981','#047857'] },
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeMode();
  const { auth, signOut } = useAuth();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  // El saludo toma SIEMPRE el nombre del perfil (/api/auth/me) y la foto de perfil:
  // si se edita en Perfil, al volver aquí queda actualizado.
  const [profileName, setProfileName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await apiClient.get('/api/auth/me');
        const u = data?.user ?? data;
        const full = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim();
        if (active) setProfileName(full);
        // Foto desde el backend (base64 data URI)
        if (active) {
          if (u?.profilePhotoUrl) {
            setAvatarUri(u.profilePhotoUrl);
            const key = auth.userId ? `profileAvatarUri_${auth.userId}` : 'profileAvatarUri';
            SecureStore.setItemAsync(key, u.profilePhotoUrl).catch(() => {});
          } else {
            // Fallback: foto local
            const key = auth.userId ? `profileAvatarUri_${auth.userId}` : 'profileAvatarUri';
            const uri = await SecureStore.getItemAsync(key);
            setAvatarUri(uri ?? null);
          }
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [auth.userId]));

  // Estadísticas reales del usuario (viajes + favoritos).
  const [homeStats, setHomeStats] = useState<{
    co2Kg: number; trips: number; minutes: number; favs: number;
  } | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      try {
        const [tripsRes, favsRes] = await Promise.all([
          apiClient.get('/api/trips'),
          apiClient.get('/api/favorites'),
        ]);
        const items: any[] = Array.isArray(tripsRes.data) ? tripsRes.data : (tripsRes.data?.items ?? []);
        const favItems: any[] = Array.isArray(favsRes.data) ? favsRes.data : (favsRes.data?.items ?? []);
        if (!active) return;
        const valid = items.filter(x => x && (x.usageId || x.id));
        setHomeStats({
          co2Kg: valid.reduce((a, x) => a + (Number(x.actualCo2Kg) || 0), 0),
          trips: valid.length,
          minutes: valid.reduce((a, x) => a + (Number(x.actualDurationMin) || 0), 0),
          favs: favItems.filter(x => x && (x.routeId || x.id)).length,
        });
      } catch {}
    })();
    return () => { active = false; };
  }, []));

  // Muestra: dato real si hay, "—" si no hay sesión o aún no cargó.
  const stat = (v?: string) => (homeStats ? v : '—');
  const co2Shown = stat(homeStats && homeStats.co2Kg > 0 ? `${homeStats.co2Kg.toFixed(1)} kg` : '0 kg');
  const tripsShown = stat(homeStats ? String(homeStats.trips) : '—');
  const timeShown = stat(homeStats ? `${Math.floor(homeStats.minutes / 60)} h` : '—');
  const favsShown = stat(homeStats ? String(homeStats.favs) : '—');

  // Se muestra solo la primera palabra del nombre del perfil.
  const firstWord = (v?: string | null) => (v || '').trim().split(' ')[0] || '';
  const userName =
    firstWord(profileName)
    || firstWord(auth.firstName)
    || (auth.email ? auth.email.split('@')[0] : '')
    || t('home.defaultUser');

  const handleModulePress = (id: string) => {
    if (id === 'plan_ruta') router.push('/(tabs)/plan-route');
    else if (id === 'mis_rutas') router.push('/(tabs)/saved-routes');
    else if (id === 'historial') router.push('/(tabs)/history');
    else if (id === 'perfil') router.push('/(tabs)/profile');
    else if (id === 'alertas') router.push('/(tabs)/alerts');
    else if (id === 'stats') router.push('/(tabs)/stats');
    else router.push('/(tabs)/plan-route');
  };

  return (
    <View style={[s.page, isDark && s.pageDark]}>
      <View style={[s.header, isDark && s.headerDark]}>
        <View style={s.headerLeft}>
          <View style={s.logoBox}><Ionicons name="leaf" size={20} color="#fff" /></View>
          <Text style={[s.headerTitle, isDark&&{color:'#e2e8f0'}]}>{t('common.appName')}</Text>
        </View>

        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={s.avatarHeaderBtn} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={s.headerAvatar} />
            ) : (
              <View style={[s.headerAvatarPlaceholder, isDark && { backgroundColor: '#1e293b' }]}>
                <Ionicons name="person" size={16} color={isDark ? '#34d399' : '#059669'} />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={async()=>{await signOut(); router.replace('/(auth)/login');}} style={[s.logoutBtn, isDark&&{backgroundColor:'#162329',borderColor:'#26383D'}]}>
            <Ionicons name="log-out-outline" size={16} color={isDark?'#e2e8f0':'#4b5563'} />
            <Text style={[s.logoutText, isDark&&{color:'#e2e8f0'}]}>{t('home.logoutShort')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={[s.greetingCard, isDark&&s.greetingCardDark]}>
          <View style={s.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={[s.greetingTitle, isDark&&{color:'#e2e8f0'}]}>{t('home.hello')}, {userName} 👋</Text>
              <Text style={[s.greetingSub, isDark&&{color:'#94a3b8'}]}>{t('home.greetingSub')}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.85} style={s.greetingAvatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.greetingAvatar} />
              ) : (
                <View style={[s.greetingAvatarPlaceholder, isDark && { backgroundColor: '#1e293b' }]}>
                  <Ionicons name="person" size={24} color={isDark ? '#34d399' : '#059669'} />
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={s.statsGrid}>
            <View style={s.statsRow}>
              <View style={[s.statCard, isDark && s.statCardDark]}>
                <View style={[s.statIcon, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.12)' }]}>
                  <Ionicons name="leaf" size={22} color={isDark ? '#34D399' : '#059669'} />
                </View>
                <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{co2Shown}</Text>
                <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('home.statCo2')}</Text>
              </View>

              <View style={[s.statCard, isDark && s.statCardDark]}>
                <View style={[s.statIcon, { backgroundColor: isDark ? 'rgba(6,182,214,0.2)' : 'rgba(6,182,214,0.12)' }]}>
                  <Ionicons name="navigate" size={22} color={isDark ? '#22d3ee' : '#0284c7'} />
                </View>
                <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{tripsShown}</Text>
                <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('home.statTrips')}</Text>
              </View>
            </View>

            <View style={s.statsRow}>
              <View style={[s.statCard, isDark && s.statCardDark]}>
                <View style={[s.statIcon, { backgroundColor: isDark ? 'rgba(168,85,247,0.2)' : 'rgba(168,85,247,0.12)' }]}>
                  <Ionicons name="time" size={22} color={isDark ? '#c084fc' : '#7c3aed'} />
                </View>
                <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{timeShown}</Text>
                <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('home.statTime')}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  router.push({ pathname: '/(tabs)/saved-routes', params: { tab: 'favorites' } });
                }}
                style={[s.statCard, isDark && s.statCardDark]}
              >
                <View style={[s.statIcon, { backgroundColor: isDark ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.12)' }]}>
                  <Ionicons name="heart" size={22} color={isDark ? '#fb7185' : '#e11d48'} />
                </View>
                <Text style={[s.statValue, isDark && { color: '#e2e8f0' }]}>{favsShown}</Text>
                <Text style={[s.statLabel, isDark && { color: '#94a3b8' }]}>{t('home.statFavs')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sección de Módulos estrictamente en 2 columnas */}
        <View style={s.toolsHeader}>
          <Text style={[s.toolsTitle, isDark&&{color:'#e2e8f0'}]}>{t('home.tools')}</Text>
          <Text style={[s.toolsCount, isDark&&{color:'#94a3b8'}]}>{MODULES.length} {t('home.modulesCount')}</Text>
        </View>

        <View style={s.modulesGrid}>
          {Array.from({ length: Math.ceil(MODULES.length / 2) }).map((_, rIdx) => {
            const m1 = MODULES[rIdx * 2];
            const m2 = MODULES[rIdx * 2 + 1];
            return (
              <View key={rIdx} style={s.modulesRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleModulePress(m1.id)}
                  style={[s.moduleCard, isDark && s.moduleCardDark]}
                >
                  <View style={s.cardTopRow}>
                    <View style={[
                      s.moduleIcon,
                      { backgroundColor: isDark ? `${m1.colors[0]}28` : `${m1.colors[0]}16` }
                    ]}>
                      <Ionicons name={m1.icon as any} size={22} color={m1.colors[0]} />
                    </View>
                    <View style={[s.cardChevron, isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Ionicons name="chevron-forward" size={14} color={isDark ? '#64748b' : '#9ca3af'} />
                    </View>
                  </View>
                  <Text style={[s.moduleTitle, isDark && { color: '#f1f5f9' }]}>{t(m1.titleKey)}</Text>
                  <Text style={[s.moduleSub, isDark && { color: '#94a3b8' }]} numberOfLines={2}>
                    {t(m1.subKey)}
                  </Text>
                </TouchableOpacity>

                {m2 ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => handleModulePress(m2.id)}
                    style={[s.moduleCard, isDark && s.moduleCardDark]}
                  >
                    <View style={s.cardTopRow}>
                      <View style={[
                        s.moduleIcon,
                        { backgroundColor: isDark ? `${m2.colors[0]}28` : `${m2.colors[0]}16` }
                      ]}>
                        <Ionicons name={m2.icon as any} size={22} color={m2.colors[0]} />
                      </View>
                      <View style={[s.cardChevron, isDark && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Ionicons name="chevron-forward" size={14} color={isDark ? '#64748b' : '#9ca3af'} />
                      </View>
                    </View>
                    <Text style={[s.moduleTitle, isDark && { color: '#f1f5f9' }]}>{t(m2.titleKey)}</Text>
                    <Text style={[s.moduleSub, isDark && { color: '#94a3b8' }]} numberOfLines={2}>
                      {t(m2.subKey)}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
              </View>
            );
          })}
        </View>

        <View style={[s.impactCard, isDark&&{backgroundColor:'#064e3b'}]}>
          <View style={s.impactIcon}><Ionicons name="leaf" size={26} color="#fff" /></View>
          <Text style={s.impactTitle}>{t('home.impactCardTitle')}</Text>
          <Text style={s.impactDesc}>{t('home.impactDescBefore')}<Text style={{fontWeight:'700',color:'#fff'}}>{t('home.impactCo2')}</Text>{t('home.impactDescAfter')}</Text>
          <TouchableOpacity onPress={()=>router.push('/(tabs)/stats')} style={s.impactBtn}><Text style={s.impactBtnText}>{t('home.seeStats')}</Text></TouchableOpacity>
        </View>

        <View style={s.footer}><Ionicons name="leaf" size={14} color="#10b981" /><Text style={[s.footerText, isDark&&{color:'#94a3b8'}]}>{t('home.footerNote')}</Text></View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page:{flex:1,backgroundColor:'#f0fdf4'},
  pageDark:{backgroundColor:'#0B1215'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:Platform.OS==='android'?42:16,paddingBottom:12,backgroundColor:'rgba(255,255,255,0.95)',borderBottomWidth:1,borderBottomColor:'#f3f4f6'},
  headerDark:{backgroundColor:'rgba(22,35,41,0.95)',borderBottomColor:'#26383D'},
  headerLeft:{flexDirection:'row',alignItems:'center',gap:8},
  headerRight:{flexDirection:'row',alignItems:'center',gap:10},
  avatarHeaderBtn:{width:36,height:36,borderRadius:18,overflow:'hidden',borderWidth:2,borderColor:'#10b981'},
  headerAvatar:{width:'100%',height:'100%'},
  headerAvatarPlaceholder:{width:'100%',height:'100%',backgroundColor:'#dcfce7',alignItems:'center',justifyContent:'center'},
  logoBox:{width:40,height:40,borderRadius:12,backgroundColor:'#10b981',alignItems:'center',justifyContent:'center'},
  logoIcon:{fontSize:20,color:'#fff'},
  headerTitle:{fontSize:18,fontWeight:'800',color:'#1f2937'},
  logoutBtn:{flexDirection:'row',gap:6,paddingHorizontal:12,paddingVertical:8,borderRadius:12,backgroundColor:'#f3f4f6',borderWidth:1,borderColor:'#e5e7eb',alignItems:'center'},
  logoutText:{fontSize:12,fontWeight:'600',color:'#4b5563'},
  scroll:{padding:16,paddingBottom:32},
  greetingCard:{backgroundColor:'#fff',borderRadius:24,padding:20,borderWidth:1,borderColor:'#dcfce7',shadowColor:'#000',shadowOpacity:0.06,shadowRadius:12,shadowOffset:{width:0,height:4},elevation:2},
  greetingCardDark:{backgroundColor:'#162329',borderColor:'#26383D'},
  greetingRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},
  greetingAvatarWrap:{width:52,height:52,borderRadius:26,overflow:'hidden',borderWidth:2.5,borderColor:'#10b981'},
  greetingAvatar:{width:'100%',height:'100%'},
  greetingAvatarPlaceholder:{width:'100%',height:'100%',backgroundColor:'#dcfce7',alignItems:'center',justifyContent:'center'},
  greetingTitle:{fontSize:22,fontWeight:'800',color:'#1f2937'},
  greetingSub:{fontSize:12,color:'#6b7280',marginTop:4},
  statsGrid:{gap:12,marginTop:16},
  statsRow:{flexDirection:'row',gap:12},
  statCard:{
    flex:1,
    backgroundColor:'#fff',
    borderRadius:18,
    paddingVertical:16,
    paddingHorizontal:10,
    borderWidth:1,
    borderColor:'#f1f5f9',
    alignItems:'center',
    shadowColor:'#000',
    shadowOpacity:0.04,
    shadowRadius:8,
    shadowOffset:{width:0,height:2},
    elevation:2,
  },
  statCardDark:{backgroundColor:'rgba(11,18,21,0.4)',borderColor:'#26383D'},
  statIcon:{width:44,height:44,borderRadius:13,alignItems:'center',justifyContent:'center',marginBottom:8},
  statValue:{fontSize:19,fontWeight:'800',color:'#1f2937'},
  statLabel:{fontSize:11,color:'#6b7280',fontWeight:'600',marginTop:2},
  toolsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',marginTop:24,marginBottom:12},
  toolsTitle:{fontSize:20,fontWeight:'800',color:'#1f2937'},
  toolsCount:{fontSize:10,color:'#9ca3af',fontWeight:'600'},

  // Módulo Principal Hero
  heroModuleCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  heroModuleCardDark: {
    borderColor: '#065f46',
    backgroundColor: '#064e3b',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  heroGradientBg: {
    padding: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 20,
  },
  heroBadgeDark: {
    backgroundColor: 'rgba(6,78,59,0.7)',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  heroArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroArrowBtnDark: {
    backgroundColor: 'rgba(6,78,59,0.8)',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconBox: {
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  heroIconGradient: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },

  // Módulos en 2 columnas (Filas flex)
  modulesGrid:{gap:12},
  modulesRow:{flexDirection:'row',gap:12},
  moduleCard:{
    flex:1,
    backgroundColor:'#fff',
    borderRadius:18,
    padding:14,
    borderWidth:1,
    borderColor:'#e5e7eb',
    shadowColor:'#000',
    shadowOpacity:0.04,
    shadowRadius:8,
    shadowOffset:{width:0,height:2},
    elevation:2,
    justifyContent:'space-between',
    minHeight:122,
  },
  moduleCardDark:{backgroundColor:'#162329',borderColor:'#26383D'},
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleIcon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},
  cardChevron: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTitle:{fontSize:15,fontWeight:'700',color:'#1f2937'},
  moduleSub:{fontSize:11,color:'#6b7280',marginTop:3,lineHeight:15},

  impactCard:{backgroundColor:'#059669',borderRadius:24,padding:20,marginTop:24,overflow:'hidden'},
  impactIcon:{width:56,height:56,borderRadius:16,backgroundColor:'rgba(255,255,255,0.2)',alignItems:'center',justifyContent:'center',marginBottom:12},
  impactTitle:{fontSize:20,fontWeight:'800',color:'#fff'},
  impactDesc:{fontSize:12,color:'#d1fae5',marginTop:6,lineHeight:18},
  impactBtn:{backgroundColor:'#fff',borderRadius:12,paddingVertical:10,paddingHorizontal:16,alignSelf:'flex-start',marginTop:12},
  impactBtnText:{color:'#059669',fontWeight:'700',fontSize:12},
  footer:{flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',marginTop:24},
  footerText:{fontSize:12,color:'#6b7280'},
});
