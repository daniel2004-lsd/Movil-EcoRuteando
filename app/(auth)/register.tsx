// app/(auth)/register.tsx — 100% igual a web Register.jsx
import { Dialog } from '../../src/shared/components/ui/AppDialog';
import {  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput  } from 'react-native';
import React, { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TermsModal } from '../../src/shared/components/auth/TermsModal';
import { useLanguage } from '../../src/shared/store/LanguageContext';
import { useThemeMode } from '../../src/shared/store/ThemeContext';
import apiClient from '../../src/shared/services/apiClient';

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === 'dark';
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', pw:'', confirmPw:'' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const passwordChecks = [
    { label: t('auth.passwordMin'), ok: form.pw.length >= 8 },
    { label: t('auth.pwCheckUppercase'), ok: /[A-Z]/.test(form.pw) },
    { label: t('auth.pwCheckNumber'), ok: /\d/.test(form.pw) },
    { label: t('auth.pwCheckSpecial'), ok: /[^A-Za-z0-9]/.test(form.pw) },
  ];
  const isFormValid = () => form.firstName.trim()!=='' && form.lastName.trim()!=='' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && passwordChecks.every(c=>c.ok) && form.pw===form.confirmPw && termsAccepted;

  const handleRegister = async () => {
    setError(null);
    if (!isFormValid()) { setError(t('auth.registerInvalidForm')); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/auth/register', { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.pw });
      router.replace(`/(auth)/verify-code?email=${encodeURIComponent(form.email)}`);
    } catch (err:any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || '';
      if (err.response?.status===409 || msg.toLowerCase().includes('ya está registrado') || msg.toLowerCase().includes('already')) {
        setError(t('auth.emailAlreadyRegistered'));
        Dialog.alert(t('auth.alreadyRegisteredTitle'), t('auth.alreadyRegisteredMsg'), [
          { text: t('auth.loginButton'), onPress: ()=> router.replace('/(auth)/login') },
          { text: t('auth.resendCode'), onPress: async ()=>{ try{ await apiClient.post('/api/auth/send-verification', { email: form.email }); router.replace(`/(auth)/verify-code?email=${encodeURIComponent(form.email)}`); } catch{} } },
          { text: t('auth.cancel'), style: 'cancel' }
        ], { tone: 'warning', icon: 'mail-open' });
      } else {
        setError(err.response?.data?.detail || err.message || t('auth.registerErrorFallback'));
        Dialog.alert(t('auth.errorTitle'), err.response?.data?.detail || err.message || t('auth.registerErrorFallback'), { tone: 'error' });
      }
    } finally { setLoading(false); }
  };


  return (
    <LinearGradient colors={isDark ? ['#0B1215','#111C20'] : ['#ecfdf5','#f0fdf4','#ccfbf1']} style={s.bg}>
      <TouchableOpacity onPress={toggleTheme} style={[s.themeBtn, isDark && s.themeBtnDark]}><Text>{isDark?'☀️':'🌙'}</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>router.replace('/')} style={s.backTop}><Ionicons name="arrow-back" size={14} color={isDark?'#94a3b8':'#6b7280'} /><Text style={[s.backTopText, isDark&&{color:'#94a3b8'}]}>{t('auth.back')}</Text></TouchableOpacity>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <View style={[s.logoBox, isDark && s.logoBoxDark]}><Image source={require("../../assets/logo.png")} style={{width:40,height:40,resizeMode:"contain"}} /></View>
            <Text style={[s.appName, isDark&&{color:'#e2e8f0'}]}>{t('common.appName')}</Text>
            <Text style={[s.appSub, isDark&&{color:'#94a3b8'}]}>{t('landing.tagline')}</Text>
          </View>
          <View style={[s.card, isDark && s.cardDark]}>
            <Text style={[s.cardTitle, isDark&&{color:'#e2e8f0'}]}>{t('auth.registerTitle')}</Text>
            <Text style={[s.cardSub, isDark&&{color:'#94a3b8'}]}>{t('auth.registerTagline')}</Text>

            <View style={s.row2}>
              <View style={{flex:1}}>
                <Text style={[s.label, isDark&&{color:'#34D399'}]}>{t('auth.firstNameLabel')}</Text>
                <TextInput value={form.firstName} onChangeText={v=>setForm({...form, firstName:v})} placeholder={t('auth.firstNamePlaceholder')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} style={[s.input, isDark&&s.inputDark]} />
              </View>
              <View style={{flex:1}}>
                <Text style={[s.label, isDark&&{color:'#34D399'}]}>{t('auth.lastNameLabel')}</Text>
                <TextInput value={form.lastName} onChangeText={v=>setForm({...form, lastName:v})} placeholder={t('auth.lastNamePlaceholder')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} style={[s.input, isDark&&s.inputDark]} />
              </View>
            </View>

            <Text style={[s.label, isDark&&{color:'#34D399'}, {marginTop:14}]}>{t('auth.emailLabel')}</Text>
            <TextInput value={form.email} onChangeText={v=>setForm({...form,email:v})} placeholder={t('auth.emailPlaceholder')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} keyboardType="email-address" autoCapitalize="none" style={[s.input, isDark&&s.inputDark]} />
            {form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) && <Text style={s.okText}>{t('auth.emailValid')}</Text>}

            <Text style={[s.label, isDark&&{color:'#34D399'}, {marginTop:14}]}>{t('auth.passwordLabel')}</Text>
            <View style={[s.inputRow, isDark&&s.inputRowDark]}>
              <TextInput value={form.pw} onChangeText={v=>setForm({...form,pw:v})} placeholder={t('auth.passwordMin')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} secureTextEntry={!showPw} style={[s.inputFlex, isDark&&{color:'#e2e8f0'}]} />
              <TouchableOpacity onPress={()=>setShowPw(!showPw)}><Ionicons name={showPw?'eye-off':'eye'} size={18} color={isDark?'#94a3b8':'#6b7280'} /></TouchableOpacity>
            </View>
            {form.pw.length>0 && (
              <View style={{marginTop:8,gap:4}}>
                {passwordChecks.map((c,i)=>(
                  <View key={i} style={{flexDirection:'row',gap:6,alignItems:'center'}}>
                    <Text style={{fontSize:10,color:c.ok?'#10b981': isDark?'#94a3b8':'#9ca3af'}}>{c.ok?'✓':'○'}</Text>
                    <Text style={{fontSize:10,color:c.ok?'#10b981': isDark?'#94a3b8':'#9ca3af'}}>{c.label}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={[s.label, isDark&&{color:'#34D399'}, {marginTop:14}]}>{t('auth.confirmPasswordLabel')}</Text>
            <View style={[s.inputRow, isDark&&s.inputRowDark]}>
              <TextInput value={form.confirmPw} onChangeText={v=>setForm({...form,confirmPw:v})} placeholder={t('auth.confirmPasswordPlaceholder')} placeholderTextColor={isDark?'#94a3b8':'#9ca3af'} secureTextEntry={!showConfirmPw} style={[s.inputFlex, isDark&&{color:'#e2e8f0'}]} />
              <TouchableOpacity onPress={()=>setShowConfirmPw(!showConfirmPw)}><Ionicons name={showConfirmPw?'eye-off':'eye'} size={18} color={isDark?'#94a3b8':'#6b7280'} /></TouchableOpacity>
            </View>
            {form.confirmPw && form.pw===form.confirmPw && <Text style={s.okText}>{t('auth.passwordMatch')}</Text>}
            {form.confirmPw && form.pw!==form.confirmPw && <Text style={s.errText}>{t('auth.passwordMismatch')}</Text>}

            <View style={s.termsRow}>
              <TouchableOpacity onPress={()=>setTermsAccepted(!termsAccepted)} style={[s.checkbox, termsAccepted && s.checkboxActive]}>{termsAccepted && <Ionicons name="checkmark" size={12} color="#fff" />}</TouchableOpacity>
              <Text style={[s.termsText, isDark&&{color:'#94a3b8'}]}>{t('auth.acceptTermsPrefix')}{' '}<Text style={{color:isDark?'#34D399':'#059669'}} onPress={()=>setShowTerms(true)}>{t('auth.termsAndConditions')}</Text></Text>
            </View>

            {error && (
              <View style={[s.errorBox, isDark&&{backgroundColor:'rgba(245,158,11,0.1)',borderColor:'rgba(245,158,11,0.4)'}]}>
                <Text style={[s.errorText, isDark&&{color:'#fcd34d'}]}>{error}</Text>
                <TouchableOpacity onPress={()=>router.push('/(auth)/login')}><Text style={[s.errorLink, isDark&&{color:'#34D399'}]}>{t('auth.alreadyAccount')}{' '}{t('auth.loginHere')}</Text></TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={handleRegister} disabled={!isFormValid() || loading} style={[s.primaryBtn, (!isFormValid()||loading)&&{opacity:0.5}]}><Text style={s.primaryText}>{loading?t('auth.registering'):t('auth.registerButton')}</Text></TouchableOpacity>


            <View style={s.registerRow}><Text style={[s.registerText, isDark&&{color:'#94a3b8'}]}>{t('auth.alreadyAccount')}</Text><TouchableOpacity onPress={()=>router.replace('/(auth)/login')}><Text style={[s.registerLink, isDark&&{color:'#34D399'}]}>{' '}{t('auth.loginHere')}</Text></TouchableOpacity></View>
          </View>
          <Text style={[s.tagline, isDark&&{color:'#94a3b8'}]}>{t('auth.communityTagline')}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTerms(false);
        }}
      />
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  bg:{flex:1},
  themeBtn:{position:'absolute',bottom:24,right:24,zIndex:50,width:48,height:48,borderRadius:24,backgroundColor:'#059669',alignItems:'center',justifyContent:'center',elevation:4},
  themeBtnDark:{backgroundColor:'#162329',borderWidth:1,borderColor:'#26383D'},
  backTop:{position:'absolute',top:24,right:24,zIndex:10,flexDirection:'row',alignItems:'center',gap:4},
  backTopText:{fontSize:14,color:'#6b7280'},
  scroll:{flexGrow:1,alignItems:'center',paddingVertical:24,paddingHorizontal:16,paddingTop:60},
  logoWrap:{alignItems:'center',marginBottom:24},
  logoBox:{width:56,height:56,borderRadius:16,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',elevation:2,borderWidth:1,borderColor:'#f3f4f6'},
  logoBoxDark:{backgroundColor:'#162329',borderColor:'#26383D'},
  logoIcon:{fontSize:28},
  appName:{fontSize:24,fontWeight:'700',color:'#047857',marginTop:8},
  appSub:{fontSize:10,color:'#9ca3af',marginTop:2},
  card:{width:'100%',maxWidth:400,backgroundColor:'#fff',borderRadius:12,padding:24,elevation:4,borderWidth:1,borderColor:'#f3f4f6'},
  cardDark:{backgroundColor:'rgba(22,35,41,0.8)',borderColor:'#26383D'},
  cardTitle:{fontSize:18,fontWeight:'700',textAlign:'center',color:'#1f2937'},
  cardSub:{fontSize:12,textAlign:'center',color:'#9ca3af',marginTop:2,marginBottom:12},
  row2:{flexDirection:'row',gap:12},
  label:{fontSize:12,fontWeight:'500',color:'#4b5563',marginBottom:4},
  input:{width:'100%',borderWidth:1,borderColor:'#e5e7eb',borderRadius:8,paddingHorizontal:12,paddingVertical:8,fontSize:14,color:'#111827',backgroundColor:'#fff'},
  inputDark:{backgroundColor:'rgba(22,35,41,0.5)',borderColor:'#26383D',color:'#e2e8f0'},
  inputRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#e5e7eb',borderRadius:8,paddingHorizontal:12,backgroundColor:'#fff'},
  inputRowDark:{backgroundColor:'rgba(22,35,41,0.5)',borderColor:'#26383D'},
  inputFlex:{flex:1,paddingVertical:8,fontSize:14,color:'#111827'},
  okText:{fontSize:10,color:'#10b981',marginTop:4},
  errText:{fontSize:10,color:'#ef4444',marginTop:4},
  termsRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:14},
  checkbox:{width:16,height:16,borderRadius:4,borderWidth:1,borderColor:'#d1d5db',alignItems:'center',justifyContent:'center'},
  checkboxActive:{backgroundColor:'#059669',borderColor:'#059669'},
  termsText:{fontSize:12,color:'#6b7280'},
  errorBox:{backgroundColor:'#fffbeb',borderWidth:1,borderColor:'#fde68a',borderRadius:8,padding:12,marginTop:12,alignItems:'center'},
  errorText:{fontSize:12,color:'#92400e',textAlign:'center'},
  errorLink:{fontSize:12,color:'#059669',fontWeight:'600',marginTop:4},
  primaryBtn:{width:'100%',backgroundColor:'#059669',borderRadius:8,paddingVertical:10,alignItems:'center',marginTop:14},
  primaryText:{color:'#fff',fontWeight:'600',fontSize:14},
  registerRow:{flexDirection:'row',justifyContent:'center',marginTop:16,borderTopWidth:1,borderTopColor:'#f3f4f6',paddingTop:12},
  registerText:{fontSize:12,color:'#9ca3af'},
  registerLink:{fontSize:12,color:'#059669',fontWeight:'500'},
  tagline:{fontSize:10,color:'#9ca3af',marginTop:20,textAlign:'center'},
});
