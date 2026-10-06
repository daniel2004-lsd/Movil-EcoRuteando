// app/(tabs)/index.tsx — igual que web UserDashboard.jsx
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import { useLanguage } from '../../src/shared/store/LanguageContext';

const MODULES = [
  { id:'plan_ruta', icon:'map', titleKey:'home.modPlan', subKey:'home.modPlanSub', colors:['#10b981','#059669'] },
  { id:'mis_rutas', icon:'route', titleKey:'home.modRoutes', subKey:'home.modRoutesSub', colors:['#06b6d4','#0284c7'] },
  { id:'historial', icon:'time', titleKey:'home.modHistory', subKey:'home.modHistorySub', colors:['#a855f7','#7c3aed'] },
  { id:'favoritos', icon:'heart', titleKey:'home.modFavs', subKey:'home.modFavsSub', colors:['#f43f5e','#ef4444'] },
  { id:'perfil', icon:'person', titleKey:'home.modProfile', subKey:'home.modProfileSub', colors:['#14b8a6','#0891b2'] },
  { id:'alertas', icon:'warning', titleKey:'home.modAlerts', subKey:'home.modAlertsSub', colors:['#f59e0b','#ea580c'] },
];

export default function HomeScreen() {
  const router = useRouter();
  const { theme } = useThemeMode();
  const { auth, signOut } = useAuth();
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const userName = auth.firstName || auth.email?.split('@')[0] || t('home.defaultUser');

  return (
    <View style={[s.page, isDark && s.pageDark]}>
      <View style={[s.header, isDark && s.headerDark]}>
        <View style={s.headerLeft}>
          <View style={s.logoBox}><Text style={s.logoIcon}>🌿</Text></View>
          <Text style={[s.headerTitle, isDark&&{color:'#e2e8f0'}]}>{t('common.appName')}</Text>
        </View>
        <TouchableOpacity onPress={async()=>{await signOut(); router.replace('/(auth)/login');}} style={[s.logoutBtn, isDark&&{backgroundColor:'#162329',borderColor:'#26383D'}]}>
          <Ionicons name="log-out-outline" size={16} color={isDark?'#e2e8f0':'#4b5563'} />
          <Text style={[s.logoutText, isDark&&{color:'#e2e8f0'}]}>{t('home.logoutShort')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={[s.greetingCard, isDark&&s.greetingCardDark]}>
          <Text style={[s.greetingTitle, isDark&&{color:'#e2e8f0'}]}>{t('home.hello')}, {userName} 👋</Text>
          <Text style={[s.greetingSub, isDark&&{color:'#94a3b8'}]}>{t('home.greetingSub')}</Text>
          <View style={s.statsGrid}>
            <View style={[s.statCard, isDark&&s.statCardDark]}>
              <View style={[s.statIcon, isDark&&{backgroundColor:'rgba(16,185,129,0.2)'}]}><Ionicons name="leaf" size={20} color={isDark?'#34D399':'#fff'} /></View>
              <Text style={[s.statValue, isDark&&{color:'#e2e8f0'}]}>12.4 kg</Text>
              <Text style={[s.statLabel, isDark&&{color:'#94a3b8'}]}>{t('home.statCo2')}</Text>
            </View>
            <View style={[s.statCard, isDark&&s.statCardDark]}>
              <View style={[s.statIcon, isDark&&{backgroundColor:'rgba(6,182,214,0.2)'}]}><Ionicons name="navigate" size={20} color={isDark?'#22d3ee':'#fff'} /></View>
              <Text style={[s.statValue, isDark&&{color:'#e2e8f0'}]}>24</Text>
              <Text style={[s.statLabel, isDark&&{color:'#94a3b8'}]}>{t('home.statTrips')}</Text>
            </View>
            <View style={[s.statCard, isDark&&s.statCardDark]}>
              <View style={[s.statIcon, isDark&&{backgroundColor:'rgba(168,85,247,0.2)'}]}><Ionicons name="time" size={20} color={isDark?'#c084fc':'#fff'} /></View>
              <Text style={[s.statValue, isDark&&{color:'#e2e8f0'}]}>18h</Text>
              <Text style={[s.statLabel, isDark&&{color:'#94a3b8'}]}>{t('home.statTime')}</Text>
            </View>
            <View style={[s.statCard, isDark&&s.statCardDark]}>
              <View style={[s.statIcon, isDark&&{backgroundColor:'rgba(244,63,94,0.2)'}]}><Ionicons name="heart" size={20} color={isDark?'#fb7185':'#fff'} /></View>
              <Text style={[s.statValue, isDark&&{color:'#e2e8f0'}]}>8</Text>
              <Text style={[s.statLabel, isDark&&{color:'#94a3b8'}]}>{t('home.statFavs')}</Text>
            </View>
          </View>
        </View>

        <View style={s.toolsHeader}>
          <Text style={[s.toolsTitle, isDark&&{color:'#e2e8f0'}]}>{t('home.tools')}</Text>
          <Text style={[s.toolsCount, isDark&&{color:'#94a3b8'}]}>{MODULES.length} {t('home.modulesCount')}</Text>
        </View>

        <View style={s.modulesGrid}>
          {MODULES.map(m=>(
            <TouchableOpacity key={m.id} onPress={()=>{
              if(m.id==='plan_ruta') router.push('/(tabs)/plan-route');
              else if(m.id==='historial') router.push('/(tabs)/history');
              else if(m.id==='favoritos') router.push('/(tabs)/favorites');
              else if(m.id==='perfil') router.push('/(tabs)/profile');
              else if(m.id==='alertas') router.push('/(tabs)/plan-route');
              else router.push('/(tabs)/plan-route');
            }} style={[s.moduleCard, isDark&&s.moduleCardDark]}>
              <View style={[s.moduleIcon, isDark&&{backgroundColor:`${m.colors[0]}33`}]}>
                <Ionicons name={m.icon as any} size={24} color={isDark?m.colors[0]:'#fff'} />
              </View>
              <Text style={[s.moduleTitle, isDark&&{color:'#e2e8f0'}]}>{t(m.titleKey)}</Text>
              <Text style={[s.moduleSub, isDark&&{color:'#94a3b8'}]}>{t(m.subKey)}</Text>
            </TouchableOpacity>
          ))}
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
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,backgroundColor:'rgba(255,255,255,0.95)',borderBottomWidth:1,borderBottomColor:'#f3f4f6'},
  headerDark:{backgroundColor:'rgba(22,35,41,0.95)',borderBottomColor:'#26383D'},
  headerLeft:{flexDirection:'row',alignItems:'center',gap:8},
  logoBox:{width:40,height:40,borderRadius:12,backgroundColor:'#10b981',alignItems:'center',justifyContent:'center'},
  logoIcon:{fontSize:20,color:'#fff'},
  headerTitle:{fontSize:18,fontWeight:'800',color:'#1f2937'},
  logoutBtn:{flexDirection:'row',gap:6,paddingHorizontal:12,paddingVertical:8,borderRadius:12,backgroundColor:'#f3f4f6',borderWidth:1,borderColor:'#e5e7eb',alignItems:'center'},
  logoutText:{fontSize:12,fontWeight:'600',color:'#4b5563'},
  scroll:{padding:16,paddingBottom:32},
  greetingCard:{backgroundColor:'#fff',borderRadius:24,padding:20,borderWidth:1,borderColor:'#dcfce7',shadowColor:'#000',shadowOpacity:0.06,shadowRadius:12,shadowOffset:{width:0,height:4},elevation:2},
  greetingCardDark:{backgroundColor:'#162329',borderColor:'#26383D'},
  greetingTitle:{fontSize:22,fontWeight:'800',color:'#1f2937'},
  greetingSub:{fontSize:12,color:'#6b7280',marginTop:4},
  statsGrid:{flexDirection:'row',flexWrap:'wrap',gap:12,marginTop:16},
  statCard:{width:'48%',backgroundColor:'#fff',borderRadius:16,padding:12,borderWidth:1,borderColor:'#f3f4f6',alignItems:'center'},
  statCardDark:{backgroundColor:'rgba(11,18,21,0.4)',borderColor:'#26383D'},
  statIcon:{width:44,height:44,borderRadius:12,backgroundColor:'#10b981',alignItems:'center',justifyContent:'center',marginBottom:8},
  statValue:{fontSize:20,fontWeight:'800',color:'#1f2937'},
  statLabel:{fontSize:10,color:'#6b7280'},
  toolsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',marginTop:24,marginBottom:12},
  toolsTitle:{fontSize:20,fontWeight:'800',color:'#1f2937'},
  toolsCount:{fontSize:10,color:'#9ca3af',fontWeight:'600'},
  modulesGrid:{flexDirection:'row',flexWrap:'wrap',gap:12},
  moduleCard:{width:'48%',backgroundColor:'#fff',borderRadius:16,padding:16,borderWidth:1,borderColor:'#f3f4f6',shadowColor:'#000',shadowOpacity:0.04,shadowRadius:8,shadowOffset:{width:0,height:2},elevation:1},
  moduleCardDark:{backgroundColor:'#1f2937',borderColor:'#374151'},
  moduleIcon:{width:48,height:48,borderRadius:12,alignItems:'center',justifyContent:'center',marginBottom:12,backgroundColor:'#10b981'},
  moduleTitle:{fontSize:14,fontWeight:'700',color:'#1f2937'},
  moduleSub:{fontSize:11,color:'#6b7280',marginTop:2},
  impactCard:{backgroundColor:'#059669',borderRadius:24,padding:20,marginTop:24,overflow:'hidden'},
  impactIcon:{width:56,height:56,borderRadius:16,backgroundColor:'rgba(255,255,255,0.2)',alignItems:'center',justifyContent:'center',marginBottom:12},
  impactTitle:{fontSize:20,fontWeight:'800',color:'#fff'},
  impactDesc:{fontSize:12,color:'#d1fae5',marginTop:6,lineHeight:18},
  impactBtn:{backgroundColor:'#fff',borderRadius:12,paddingVertical:10,paddingHorizontal:16,alignSelf:'flex-start',marginTop:12},
  impactBtnText:{color:'#059669',fontWeight:'700',fontSize:12},
  footer:{flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',marginTop:24},
  footerText:{fontSize:12,color:'#6b7280'},
});
