// app/(auth)/login.tsx — 100% igual a web Login.jsx
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import {  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput  } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SocialBtn } from '../../src/shared/components/auth/SocialBtn';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import { useAuth } from '../../src/shared/store/AuthContext';
import apiClient from '../../src/shared/services/apiClient';
import * as WebBrowser from 'expo-web-browser';
import { decodeJwtPayload } from '../../src/shared/utils/jwt';
import * as Crypto from 'expo-crypto';

WebBrowser.maybeCompleteAuthSession();

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


  const handleGoogleLogin = async () => {
    const redirectUri = 'com.ecoruteando.mobile:/auth/callback';
    try {
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
      const bytes = await Crypto.getRandomBytesAsync(64);
      const verifier = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const b64 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 });
      const challenge = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('openid email profile')}&response_type=code&code_challenge=${challenge}&code_challenge_method=S256&state=google`;
      const result:any = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result?.type !== 'success') { console.warn('[OAuth-Google] cancelado, type=', result?.type);
      Dialog.alert(t('auth.oauthCancelledTitle'), t('auth.oauthCancelledMsg'), {
        tone: 'info',
        icon: 'hand-left',
      }); return; }
      const mc = String(result.url || '').match(/[?&]code=([^&]+)/);
      if (!mc) { console.warn('[OAuth-Google] sin code_verifier/authorization code');
      Dialog.alert(t('auth.oauthErrorTitle'), t('auth.oauthNoCode'), {
        tone: 'error',
      }); return; }
      const body = 'client_id='+encodeURIComponent(clientId)+'&code='+encodeURIComponent(decodeURIComponent(mc[1]))+'&redirect_uri='+encodeURIComponent(redirectUri)+'&grant_type=authorization_code&code_verifier='+encodeURIComponent(verifier);
      const tr = await fetch('https://oauth2.googleapis.com/token', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body });
      const tj:any = await tr.json().catch(() => ({}));
      const tok = tj.access_token;
      if (!tok) { console.warn('[OAuth-Google] sin access_token:', tj.error_description || tj.error || tr.status);
      Dialog.alert(t('auth.oauthErrorTitle'), t('auth.oauthNoToken'), {
        tone: 'error',
      }); return; }
      const idp = (tj.id_token ? decodeJwtPayload(tj.id_token) : null) || {};
      const {data}=await apiClient.post('/api/auth/oauth/login',{provider:'google',accessToken:tok});
      const emailForSign = (typeof idp.email === 'string' ? idp.email.trim() : '') || 'oauth@google.com';
      const firstNameForSign = (typeof idp.given_name === 'string' ? idp.given_name.trim() : '');
      await signIn({accessToken:data.accessToken,refreshToken:data.refreshToken,email: emailForSign, firstName: firstNameForSign});
      router.replace('/(tabs)');
    } catch(e:any){ console.warn('[OAuth-Google] excepción:', e?.message || e);
    Dialog.alert(t('auth.oauthErrorTitle'), t('auth.oauthNoToken'), {
      tone: 'error',
    }); }
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
      const { data } = await apiClient.post('/api/auth/login', { email: email.trim(), password });
      if (data.requiresTwoFactor) { router.push('/(auth)/verify-code'); return; }
      await signIn({ accessToken: data.accessToken, refreshToken: data.refreshToken, email: email.trim() });
      router.replace('/(tabs)');
    } catch (err:any) {
      const d = err?.response?.data || {};
      const retryAfter = Number(d.retryAfterSeconds) || parseInt(err?.response?.headers?.['retry-after'],10) || 0;
      if (retryAfter > 0) { setRetrySeconds(retryAfter); setError(d.detail || t('auth.tooManyAttempts')); }
      else setError(d.detail || d.message || err.message || t('auth.invalidCredentials'));
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={isDark ? ['#0B1215','#111C20'] : ['#ecfdf5','#f0fdf4','#ccfbf1']} style={s.bg}>
      <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}>
        <Text>{isDark ? '☀️' : '🌙'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.replace('/')} style={s.backTop}>
        <Ionicons name="arrow-back" size={14} color={isDark ? '#94a3b8' : '#6b7280'} />
        <Text style={[s.backTopText, isDark && {color:'#94a3b8'}]}>{t('auth.back')}</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <View style={[s.logoBox, isDark && s.logoBoxDark]}>
              <Image source={require("../../assets/logo.png")} style={{width:40,height:40,resizeMode:"contain"}} />
            </View>
            <Text style={[s.appName, isDark && {color:'#e2e8f0'}]}>{t('common.appName')}</Text>
            <Text style={[s.appSub, isDark && {color:'#94a3b8'}]}>{t('landing.tagline')}</Text>
          </View>

          <View style={[s.card, isDark && s.cardDark]}>
            <Text style={[s.cardTitle, isDark && {color:'#e2e8f0'}]}>{t('auth.loginTitle')}</Text>
            <Text style={[s.cardSub, isDark && {color:'#94a3b8'}]}>{t('home.welcome')}</Text>

            {error ? (
              <View style={[s.errorBox, retrySeconds>0 && s.errorBoxWarn]}>
                <Text style={[s.errorText, retrySeconds>0 && {color:'#b45309'}]}>{error}{retrySeconds>0 ? ` (${retrySeconds}s)` : ''}</Text>
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

            <View style={s.divider}><View style={[s.divLine, isDark && {backgroundColor:'#26383D'}]} /><Text style={[s.divText, isDark && {color:'#94a3b8'}]}>{t('auth.orContinueWith')}</Text><View style={[s.divLine, isDark && {backgroundColor:'#26383D'}]} /></View>

            <View style={s.socialRow}>
              <SocialBtn icon="logo-google" color="#EA4335" label="Google" disabled={retrySeconds>0} onPress={handleGoogleLogin} />
            </View>

            <View style={s.registerRow}><Text style={[s.registerText, isDark && {color:'#94a3b8'}]}>{t('auth.noAccount')}</Text><TouchableOpacity onPress={()=>router.push('/(auth)/register')}><Text style={[s.registerLink, isDark && {color:'#34D399'}]}>{' '}{t('auth.registerHere')}</Text></TouchableOpacity></View>
          </View>

          <Text style={[s.tagline, isDark && {color:'#94a3b8'}]}>{t('auth.loginTagline')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  divider:{flexDirection:'row',alignItems:'center',gap:8,marginVertical:16},
  divLine:{flex:1,height:1,backgroundColor:'#e5e7eb'},
  divText:{fontSize:10,color:'#9ca3af',textTransform:'uppercase',letterSpacing:0.5},
  socialRow:{flexDirection:'row',gap:8},
  registerRow:{flexDirection:'row',justifyContent:'center',marginTop:16,borderTopWidth:1,borderTopColor:'#f3f4f6',paddingTop:12},
  registerText:{fontSize:12,color:'#9ca3af'},
  registerLink:{fontSize:12,color:'#059669',fontWeight:'500'},
  tagline:{fontSize:10,color:'#9ca3af',marginTop:20,textAlign:'center'},
});
