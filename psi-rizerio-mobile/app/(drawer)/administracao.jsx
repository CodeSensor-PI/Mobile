import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { requestJson } from '../../services/apiClient';
import { getCurrentSession, alterarSenha } from '../../services/authService';
import { getPsicologoPorId, putPsicologo } from '../../services/dashboardService';
import { digitsOnly, formatTelefone, formatCrp, buildStrength } from '../../utils/formatters';
import { isAdminRole } from '../../constants/role-theme';

export default function AdministracaoScreen() {
  const router = useRouter();
  const session = getCurrentSession();
  const userRole = session?.usuario?.role || session?.usuario?.fkRoles;
  const isAdmin = isAdminRole(userRole);

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [crp, setCrp] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'success' });

  const strength = useMemo(() => buildStrength(novaSenha), [novaSenha]);
  const passwordsMatch = useMemo(() => Boolean(novaSenha && confirmarSenha && novaSenha === confirmarSenha), [novaSenha, confirmarSenha]);

  const fetchUsers = async () => {
    if (!isAdmin) return;
    try {
      const data = await requestJson('/api/v1/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const handleUpdateRole = async (targetId, newRole) => {
    try {
      await requestJson(`/api/v1/users/${targetId}/role`, {
        method: 'PUT',
        body: newRole,
      });
      fetchUsers();
      openSuccess('Role atualizada com sucesso!');
    } catch (error) {
      openError('Erro ao atualizar role: ' + error.message);
    }
  };

  useEffect(() => {
    if (!session?.usuario?.id) {
      router.replace('/(auth)/login');
      return;
    }

    setUserId(String(session.usuario.id));

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPsicologoPorId(session.usuario.id);
        if (!data) throw new Error('Usuário não encontrado.');

        setNome(data.name || data.nome || '');
        setEmail(data.email || '');
        setTelefone(formatTelefone(data.phone || data.telefone || ''));
        setCrp(formatCrp(data.crp || ''));
        
        if (isAdmin) await fetchUsers();
      } catch (error) {
        setAlert({ visible: true, title: 'Erro', message: error.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const openError = (message) => setAlert({ visible: true, title: 'Atenção', message, type: 'error' });
  const openSuccess = (message) => setAlert({ visible: true, title: 'Sucesso', message, type: 'success' });

  const saveGeneral = async () => {
    if (!email || !nome || !telefone) return openError('Preencha os campos!');
    setSavingGeneral(true);
    try {
      await putPsicologo(userId, { email, name: nome, phone: digitsOnly(telefone), crp: digitsOnly(crp) });
      openSuccess('Dados atualizados!');
    } catch (error) { openError(error.message); }
    finally { setSavingGeneral(false); }
  };

  const savePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) return openError('Preencha os campos!');
    if (novaSenha !== confirmarSenha) return openError('Senhas não coincidem!');
    if (strength.score < 5) return openError('Senha fraca!');
    setSavingPassword(true);
    try {
      await alterarSenha(userId, senhaAtual, novaSenha);
      openSuccess('Senha alterada!');
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('');
    } catch (error) { openError(error.message); }
    finally { setSavingPassword(false); }
  };

  const handleCloseAlert = () => setAlert((prev) => ({ ...prev, visible: false }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Administração</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}><Text>Carregando...</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isAdmin && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Gerenciamento de Usuários (ADM)</Text>
              <View style={{ marginTop: 12 }}>
                {users.map((u) => (
                  <View key={u.id} style={styles.userRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.name}</Text>
                      <Text style={styles.userEmail}>{u.email}</Text>
                    </View>
                    <View style={styles.roleButtons}>
                      {['ADMIN', 'PSYCHOLOGIST', 'USER'].map((r) => (
                        <Pressable 
                          key={r} 
                          onPress={() => handleUpdateRole(u.id, r)}
                          style={[styles.roleBtn, u.role === r && styles.roleBtnActive]}
                        >
                          <Text style={[styles.roleBtnText, u.role === r && styles.roleBtnTextActive]}>{r.slice(0, 3)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Meus Dados:</Text>
            </View>
            <AuthTextInput label="Nome" value={nome} onChangeText={setNome} editable={true} />
            <AuthTextInput label="E-mail" value={email} onChangeText={setEmail} editable={true} />
            <AuthTextInput label="Telefone" value={telefone} onChangeText={(v) => setTelefone(formatTelefone(v))} editable={true} />
            <AuthTextInput label="CRP" value={crp} onChangeText={(v) => setCrp(formatCrp(v))} />
            <AuthButton label="Salvar Alterações" loading={savingGeneral} onPress={saveGeneral} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Segurança:</Text>
            </View>
            <AuthTextInput label="Senha Atual" value={senhaAtual} onChangeText={setSenhaAtual} secureTextEntry editable={true} />
            <AuthTextInput label="Nova Senha" value={novaSenha} onChangeText={setNovaSenha} secureTextEntry editable={true} />
            <AuthTextInput label="Confirmar" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry editable={true} />
            <AuthButton label="Alterar Senha" loading={savingPassword} onPress={savePassword} />
          </View>
        </ScrollView>
      )}
      <CustomAlert visible={alert.visible} title={alert.title} message={alert.message} type={alert.type} onClose={handleCloseAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4fb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 4,
    color: '#475569',
    fontSize: 14,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: '#475569',
    fontSize: 16,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dbe4f0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  editButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  cardAction: {
    marginTop: 6,
  },
  matchText: {
    marginTop: 4,
    fontWeight: '700',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  roleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleBtnActive: {
    backgroundColor: '#1d4ed8',
    borderColor: '#1d4ed8',
  },
  roleBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  roleBtnTextActive: {
    color: '#ffffff',
  },
});
