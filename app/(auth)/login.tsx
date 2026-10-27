import {  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Modal, ActivityIndicator  } from 'react-native';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import apiClient, { API_BASE } from '../../src/shared/services/apiClient';
import { validateApiUrl } from '../../src/shared/utils/urlValidation';
import * as SecureStore from '../../src/shared/services/keyStorage';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useThemeMode();
  const { signIn } = useAuth();
  const isDark = theme === 'dark';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retrySeconds, setRetrySeconds] = useState(0);
  const [showServerModal, setShowServerModal] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const loadServerUrl = async () => {
    const saved = await SecureStore.getItemAsync('customApiUrl');
    setServerUrlInput(saved || API_BASE);
    setTestStatus(null);
    setTestMessage(null);
  };

  const handleOpenServerModal = async () => {
    await loadServerUrl();
    setShowServerModal(true);
  };

  const handleTestConnection = async (urlToTest?: string) => {
    const rawTarget = (urlToTest || serverUrlInput || API_BASE).trim().replace(/\/+$/, '');
    const validation = validateApiUrl(rawTarget, !__DEV__);
    if (!validation.isValid || !validation.normalizedUrl) {
      setTestStatus('error');
      setTestMessage(`❌ ${validation.error || 'La URL ingresada no es válida.'}`);
      return;
    }
    const target = validation.normalizedUrl;
    setTestStatus('testing');
    setTestMessage('Probando conexión al servidor...');
    try {
      const res = await axios.post(`${target}/api/auth/login`, {}, { timeout: 6000 }).catch(e => e.response);
      if (res?.status === 400 || res?.status === 401) {
        setTestStatus('success');
        setTestMessage('✅ ¡Conexión exitosa con el backend!');
      } else if (res?.status) {
        setTestStatus('success');
        setTestMessage(`✅ Servidor respondió (código ${res.status})`);
      } else {
        setTestStatus('error');
        setTestMessage('❌ Sin respuesta del servidor en esta URL.');
      }
    } catch (e: any) {
      setTestStatus('error');
      setTestMessage(`❌ Error de red: ${e?.message || 'Tiempo de espera agotado'}`);
    }
  };

  const handleSaveServerUrl = async () => {
    const cleaned = serverUrlInput.trim().replace(/\/+$/, '');
    if (cleaned) {
      const validation = validateApiUrl(cleaned, !__DEV__);
      if (!validation.isValid || !validation.normalizedUrl) {
        setTestStatus('error');
        setTestMessage(`❌ ${validation.error || 'URL no permitida.'}`);
        return;
      }
      await SecureStore.setItemAsync('customApiUrl', validation.normalizedUrl);
    } else {
      await SecureStore.deleteItemAsync('customApiUrl');
    }
    setShowServerModal(false);
    setError('');
  };

  const handleResetServerUrl = async () => {
    await SecureStore.deleteItemAsync('customApiUrl');
    setServerUrlInput(API_BASE);
    setShowServerModal(false);
    setError('');
  };


  useEffect(() => {
    if (retrySeconds <= 0) return;
    const id = setInterval(() => setRetrySeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [retrySeconds]);

  const handleLogin = async () => {
    if (retrySeconds > 0) return;
    setError('');
    if (!email.trim() || !password.trim()) { setError(t('auth.fillAllFields')); return; }
    if (password.length < 8) { setError(t('auth.passwordMin8Error')); return; }
    setLoading(true);
    try {
      const { data } = await apiClient.post('/api/auth/login', { email: email.trim(), password: password.trim() });
      if (data.requiresTwoFactor) { router.push('/(auth)/verify-code'); return; }
      if (data.requiresEmailVerification) { router.push('/(auth)/verify-code'); return; }
      await signIn({ accessToken: data.accessToken, refreshToken: data.refreshToken, email: email.trim() });
      router.replace('/(tabs)');
    } catch (err: any) {
      const d = err?.response?.data || {};
      const retryAfter = Number(d.retryAfterSeconds) || parseInt(err?.response?.headers?.['retry-after'], 10) || 0;
      if (retryAfter > 0) {
        setRetrySeconds(retryAfter);
        setError(d.detail || t('auth.tooManyAttempts'));
      } else if (!err?.response && (err.message?.includes('Network') || err.message?.includes('network') || !err.status)) {
        setError('No se pudo establecer conexión con el servidor. Verifica tu conexión a internet o el servidor configurado.');
      } else {
        setError(d.detail || d.message || err.message || t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={isDark ? ['#0B1215','#111C20'] : ['#ecfdf5','#f0fdf4','#ccfbf1']} style={s.bg}>
      <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}>
        <Text>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleOpenServerModal} style={[s.serverBtn, isDark && s.serverBtnDark]}>
        <Ionicons name="server-outline" size={20} color={isDark ? '#34D399' : '#fff'} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/')} style={s.backTop}>
        <Ionicons name="arrow-back" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
        <Text style={[s.backTopText, isDark && {color:'#94a3b8'}]}>{t('auth.back')}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <TouchableOpacity onPress={handleOpenServerModal} activeOpacity={0.8}>
              <View style={[s.logoBox, isDark && s.logoBoxDark]}>
                <Image source={require("../../assets/logo.png")} style={{width:40,height:40,resizeMode:"contain"}} />
              </View>
            </TouchableOpacity>
            <Text style={[s.appName, isDark && {color:'#e2e8f0'}]}>{t('common.appName')}</Text>
            <Text style={[s.appSub, isDark && {color:'#94a3b8'}]}>{t('landing.tagline')}</Text>
          </View>

          <View style={[s.card, isDark && s.cardDark]}>
            <Text style={[s.cardTitle, isDark && {color:'#e2e8f0'}]}>{t('auth.loginTitle')}</Text>
            <Text style={[s.cardSub, isDark && {color:'#94a3b8'}]}>{t('home.welcome')}</Text>

            {error ? (
              <View style={[s.errorBox, retrySeconds>0 && s.errorBoxWarn]}>
                <Text style={[s.errorText, retrySeconds>0 && {color:'#b45309'}]}>{error}{retrySeconds>0 ? ` (${retrySeconds}s)` : ''}</Text>
                <TouchableOpacity onPress={handleOpenServerModal} style={{marginTop: 6, alignSelf: 'center'}}>
                  <Text style={{color: isDark ? '#34D399' : '#059669', fontSize: 11, fontWeight: '600', textDecorationLine: 'underline'}}>
                    ⚙️ Configurar servidor del backend
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={[s.label, isDark && {color:'#34D399'}]}>{t('auth.emailLabel')}</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder={t('auth.emailPlaceholder')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} keyboardType="email-address" autoCapitalize="none" style={[s.input, isDark && s.inputDark]} />

            <Text style={[s.label, isDark && {color:'#34D399'}, {marginTop:14}]}>{t('auth.passwordLabel')}</Text>
            <View style={[s.inputRow, isDark && s.inputRowDark]}>
              <TextInput value={password} onChangeText={setPassword} placeholder={t('auth.passwordMin')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} secureTextEntry={!showPw} style={[s.inputFlex, isDark && {color:'#e2e8f0'}]} />
              <TouchableOpacity onPress={()=>setShowPw(!showPw)}><Ionicons name={showPw?'eye-off':'eye'} size={18} color={isDark?'#94a3b8':'#6b7280'} /></TouchableOpacity>
            </View>
            <TouchableOpacity onPress={()=>router.push('/(auth)/recover')} style={s.forgot}><Text style={[s.forgotText, isDark && {color:'#34D399'}]}>{t('auth.forgotPassword')}</Text></TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} disabled={loading || retrySeconds>0} style={[s.primaryBtn, (loading||retrySeconds>0) && {opacity:0.5}]}><Text style={s.primaryText}>{loading ? t('auth.loggingIn') : t('auth.loginButton')}</Text></TouchableOpacity>

            <View style={s.registerRow}><Text style={[s.registerText, isDark && {color:'#94a3b8'}]}>{t('auth.noAccount')}</Text><TouchableOpacity onPress={()=>router.push('/(auth)/register')}><Text style={[s.registerLink, isDark && {color:'#34D399'}]}>{' '}{t('auth.registerHere')}</Text></TouchableOpacity></View>
          </View>

          <Text style={[s.tagline, isDark && {color:'#94a3b8'}]}>{t('auth.loginTagline')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showServerModal} transparent animationType="fade" onRequestClose={()=>setShowServerModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, isDark && s.modalCardDark]}>
            <Text style={[s.modalTitle, isDark && {color: '#e2e8f0'}]}>Configuración del Servidor</Text>
            <Text style={[s.modalSub, isDark && {color: '#94a3b8'}]}>
              URL base de la API del backend:
            </Text>
            <TextInput
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="https://ecoruteando-backend.onrender.com"
              placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
              autoCapitalize="none"
              autoCorrect={false}
              style={[s.input, isDark && s.inputDark, {marginVertical: 10}]}
            />

            {/* Presets seguros */}
            <Text style={{fontSize: 11, fontWeight: '600', color: isDark ? '#94a3b8' : '#6b7280', marginBottom: 6}}>
              Servidores autorizados:
            </Text>
            <View style={{flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap'}}>
              <TouchableOpacity
                onPress={() => {
                  setServerUrlInput(API_BASE);
                  handleTestConnection(API_BASE);
                }}
                style={{paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, backgroundColor: isDark ? '#1e293b' : '#ecfdf5', borderWidth: 1, borderColor: '#10b981'}}
              >
                <Text style={{fontSize: 11, color: isDark ? '#34D399' : '#047857', fontWeight: '600'}}>
                  🛡️ Producción Oficial (HTTPS)
                </Text>
              </TouchableOpacity>
              {__DEV__ && (
                <TouchableOpacity
                  onPress={() => {
                    const localDev = 'http://localhost:5124';
                    setServerUrlInput(localDev);
                    handleTestConnection(localDev);
                  }}
                  style={{paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6, backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderWidth: 1, borderColor: '#3b82f6'}}
                >
                  <Text style={{fontSize: 11, color: isDark ? '#60a5fa' : '#1d4ed8', fontWeight: '600'}}>
                    🔧 Localhost Dev (5124)
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Mensaje de prueba */}
            {testMessage ? (
              <View style={{padding: 8, borderRadius: 6, backgroundColor: testStatus === 'success' ? '#f0fdf4' : testStatus === 'testing' ? '#eff6ff' : '#fef2f2', marginBottom: 10}}>
                <Text style={{fontSize: 11, color: testStatus === 'success' ? '#166534' : testStatus === 'testing' ? '#1e40af' : '#991b1b', textAlign: 'center'}}>
                  {testMessage}
                </Text>
              </View>
            ) : null}

            <View style={{flexDirection: 'row', gap: 6, justifyContent: 'space-between', alignItems: 'center'}}>
              <TouchableOpacity
                onPress={() => handleTestConnection()}
                disabled={testStatus === 'testing'}
                style={{paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#e2e8f0'}}
              >
                <Text style={{fontSize: 12, fontWeight: '600', color: isDark ? '#f8fafc' : '#334155'}}>
                  {testStatus === 'testing' ? 'Probando...' : '🔍 Probar'}
                </Text>
              </TouchableOpacity>

              <View style={{flexDirection: 'row', gap: 6}}>
                <TouchableOpacity onPress={()=>setShowServerModal(false)} style={[s.modalSecondaryBtn, isDark && s.modalSecondaryBtnDark]}>
                  <Text style={[s.modalSecondaryText, isDark && {color: '#94a3b8'}]}>Cerrar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveServerUrl} style={s.modalPrimaryBtn}>
                  <Text style={s.modalPrimaryText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>

  );
}

const s = StyleSheet.create({
  bg:{flex:1},
  themeBtn:{position:'absolute',bottom:24,right:24,zIndex:50,width:48,height:48,borderRadius:24,backgroundColor:'#059669',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:0.2,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:4},
  themeBtnDark:{backgroundColor:'#162329',borderWidth:1,borderColor:'#26383D'},
  backTop:{position:'absolute',top:24,right:24,zIndex:10,flexDirection:'row',alignItems:'center',gap:4},
  backTopText:{fontSize:14,color:'#6b7280'},
  scroll:{flexGrow:1,alignItems:'center',paddingVertical:24,paddingHorizontal:16,paddingTop:60},
  logoWrap:{alignItems:'center',marginBottom:24},
  logoBox:{width:56,height:56,borderRadius:16,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:0.1,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:2,borderWidth:1,borderColor:'#f3f4f6'},
  logoBoxDark:{backgroundColor:'#162329',borderColor:'#26383D'},
  logoIcon:{fontSize:28},
  appName:{fontSize:24,fontWeight:'700',color:'#047857',marginTop:8,fontFamily:'Times New Roman'},
  appSub:{fontSize:10,color:'#9ca3af',marginTop:2},
  card:{width:'100%',maxWidth:384,backgroundColor:'#fff',borderRadius:12,padding:24,shadowColor:'#000',shadowOpacity:0.1,shadowRadius:12,shadowOffset:{width:0,height:4},elevation:4,borderWidth:1,borderColor:'#f3f4f6'},
  cardDark:{backgroundColor:'rgba(22,35,41,0.8)',borderColor:'#26383D'},
  cardTitle:{fontSize:18,fontWeight:'700',textAlign:'center',color:'#1f2937'},
  cardSub:{fontSize:12,textAlign:'center',color:'#9ca3af',marginTop:2,marginBottom:12},
  errorBox:{backgroundColor:'#fef2f2',borderWidth:1,borderColor:'#fecaca',borderRadius:8,padding:8,marginBottom:12},
  errorBoxWarn:{backgroundColor:'#fffbeb',borderColor:'#fde68a'},
  errorText:{fontSize:12,color:'#dc2626',textAlign:'center'},
  label:{fontSize:12,fontWeight:'500',color:'#4b5563',marginBottom:4},
  input:{width:'100%',borderWidth:1,borderColor:'#e5e7eb',borderRadius:8,paddingHorizontal:12,paddingVertical:8,fontSize:14,color:'#111827',backgroundColor:'#fff'},
  inputDark:{backgroundColor:'rgba(22,35,41,0.5)',borderColor:'#26383D',color:'#e2e8f0'},
  inputRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#e5e7eb',borderRadius:8,paddingHorizontal:12,backgroundColor:'#fff'},
  inputRowDark:{backgroundColor:'rgba(22,35,41,0.5)',borderColor:'#26383D'},
  inputFlex:{flex:1,paddingVertical:8,fontSize:14,color:'#111827'},
  forgot:{alignSelf:'flex-end',marginTop:6},
  forgotText:{fontSize:10,color:'#059669'},
  primaryBtn:{width:'100%',backgroundColor:'#059669',borderRadius:8,paddingVertical:10,alignItems:'center',marginTop:14},
  primaryText:{color:'#fff',fontWeight:'600',fontSize:14},
  registerRow:{flexDirection:'row',justifyContent:'center',marginTop:16,borderTopWidth:1,borderTopColor:'#f3f4f6',paddingTop:12},
  registerText:{fontSize:12,color:'#9ca3af'},
  registerLink:{fontSize:12,color:'#059669',fontWeight:'500'},
  tagline:{fontSize:10,color:'#9ca3af',marginTop:20,textAlign:'center'},
  serverBtn:{position:'absolute',bottom:24,left:24,zIndex:50,width:48,height:48,borderRadius:24,backgroundColor:'#059669',alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:0.2,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:4},
  serverBtnDark:{backgroundColor:'#162329',borderWidth:1,borderColor:'#26383D'},
  modalOverlay:{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'center',alignItems:'center',padding:20},
  modalCard:{width:'100%',maxWidth:360,backgroundColor:'#fff',borderRadius:16,padding:20,shadowColor:'#000',shadowOpacity:0.25,shadowRadius:12,elevation:6},
  modalCardDark:{backgroundColor:'#162329',borderWidth:1,borderColor:'#26383D'},
  modalTitle:{fontSize:16,fontWeight:'700',color:'#111827'},
  modalSub:{fontSize:12,color:'#6b7280',marginTop:4},
  modalPrimaryBtn:{backgroundColor:'#059669',paddingVertical:8,paddingHorizontal:16,borderRadius:8},
  modalPrimaryText:{color:'#fff',fontSize:13,fontWeight:'600'},
  modalSecondaryBtn:{backgroundColor:'#f3f4f6',paddingVertical:8,paddingHorizontal:12,borderRadius:8},
  modalSecondaryBtnDark:{backgroundColor:'#1e293b',borderWidth:1,borderColor:'#334155'},
  modalSecondaryText:{color:'#4b5563',fontSize:13,fontWeight:'500'},
});
