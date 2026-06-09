import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomAlert } from '../../components/CustomAlert';
import { AuthButton } from '../../components/ui/AuthButton';
import { AuthTextInput } from '../../components/ui/AuthTextInput';
import { PasswordStrengthIndicator } from '../../components/ui/PasswordStrengthIndicator';
import { RegistroModal } from '../../components/admin/RegistroModal';
import { PhotoPicker } from '../../components/ui/PhotoPicker';
import { getCurrentSession, alterarSenha } from '../../services/authService';
import { getPsicologoPorId, putPsicologo, getAllUsers, updateUserRole, postPsicologo, postPaciente } from '../../services/dashboardService';

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatTelefone(value) {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCrp(value) {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function buildStrength(password) {
  const source = password || '';
  const checks = {
    length: source.length >= 12,
    lower: /[a-z]/.test(source),
    upper: /[A-Z]/.test(source),
    number: /[0-9]/.test(source),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(source),
  };

  let score = 0;
  if (checks.length) score += 2;
  if (checks.lower) score += 1;
  if (checks.upper) score += 1;
  if (checks.number) score += 1;
  if (checks.special) score += 1;

  return { checks, score: Math.min(score, 5) };
}

export default function AdministracaoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
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

  // Camera & Profile Photo
  const [photo, setPhoto] = useState(null);

  // Registration Modal
  const [registroVisible, setRegistroVisible] = useState(false);
  const [registering, setRegistering] = useState(false);

  // User Management
  const [usersVisible, setUsersVisible] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const strength = useMemo(() => buildStrength(novaSenha), [novaSenha]);
  const passwordsMatch = useMemo(() => Boolean(novaSenha && confirmarSenha && novaSenha === confirmarSenha), [novaSenha, confirmarSenha]);

  useEffect(() => {
    const session = getCurrentSession();
    if (!session?.usuario?.id) {
      router.replace('/(auth)/login');
      return;
    }

    setUserId(String(session.usuario.id));
    
    // Verifies if the user is an admin to show user management section
    const userRole = session.usuario.role?.role || session.usuario.role;
    if (String(userRole).toUpperCase() === 'ADMIN') {
      setIsAdmin(true);
    }

    const load = async () => {
      setLoading(true);
      try {
        const data = await getPsicologoPorId(session.usuario.id);
        if (!data) {
          throw new Error('Usuário não encontrado.');
        }

        setNome(data.nome || '');
        setEmail(data.email || '');
        setTelefone(formatTelefone(data.telefone || ''));
        setCrp(formatCrp(data.crp || ''));
        if (data.photo) {
          setPhoto(data.photo);
        }
      } catch (error) {
        setAlert({
          visible: true,
          title: 'Erro',
          message: error.message || 'Erro ao carregar informações do usuário.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const openError = (message) => {
    setAlert({ visible: true, title: 'Atenção', message, type: 'error' });
  };

  const openSuccess = (message) => {
    setAlert({ visible: true, title: 'Sucesso', message, type: 'success' });
  };

  const toggleGeneralEdit = () => {
    if (isEditingGeneral) {
      setAlert({
        visible: true,
        title: 'Cancelar edição?',
        message: 'Tem certeza que deseja cancelar a edição?',
        type: 'warning',
        confirmAction: () => setIsEditingGeneral(false),
      });
      return;
    }

    setIsEditingGeneral(true);
  };

  const togglePasswordEdit = () => {
    if (isEditingPassword) {
      setAlert({
        visible: true,
        title: 'Cancelar edição da senha?',
        message: 'Tem certeza que deseja cancelar a edição da senha?',
        type: 'warning',
        confirmAction: () => setIsEditingPassword(false),
      });
      return;
    }

    setIsEditingPassword(true);
  };

  const saveGeneral = async () => {
    if (!email || !nome || !telefone) {
      openError('Todos os campos devem estar preenchidos!');
      return;
    }

    setSavingGeneral(true);

    try {
      await putPsicologo(userId, {
        email,
        nome,
        telefone: digitsOnly(telefone),
        crp: digitsOnly(crp),
        photo,
      });
      openSuccess('Dados atualizados com sucesso!');
      setIsEditingGeneral(false);
    } catch (error) {
      openError(error.message || 'Erro ao salvar dados.');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleRegisterUser = async (form) => {
    setRegistering(true);
    try {
      if (form.tipo === 'PACIENTE') {
        await postPaciente({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          cpf: form.cpf,
          dataNascimento: form.dataNascimento,
          // Outros campos se necessário
        });
      } else {
        await postPsicologo({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          crp: form.crp,
          role: { role: form.tipo } // PSICOLOGO ou ADMIN
        });
      }
      openSuccess(`Usuário ${form.nome} cadastrado com sucesso!`);
      setRegistroVisible(false);
    } catch (error) {
      openError(error.message || 'Falha ao registrar usuário.');
    } finally {
      setRegistering(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const users = await getAllUsers();
      setUsersList(users);
    } catch (error) {
      openError('Erro ao carregar usuários.');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChangeRole = async (user, newRole) => {
    try {
      await updateUserRole(user.id, newRole);
      openSuccess('Permissão atualizada com sucesso!');
      loadUsers();
    } catch (error) {
      openError('Erro ao atualizar permissão.');
    }
  };

  const openUserManagement = () => {
    setUsersVisible(true);
    loadUsers();
  };

  const savePassword = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      openError('Todos os campos devem estar preenchidos!');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      openError('A nova senha e a confirmação não coincidem!');
      return;
    }

    if (strength.score < 5) {
      openError('A senha deve ser forte para continuar.');
      return;
    }

    setSavingPassword(true);

    try {
      await alterarSenha(userId, senhaAtual, novaSenha);
      openSuccess('Senha alterada com sucesso!');
      setIsEditingPassword(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error) {
      if (error.code === 'INVALID_CURRENT_PASSWORD') {
        openError('Senha atual inválida.');
      } else {
        openError(error.message || 'Erro ao alterar a senha.');
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert((prev) => ({ ...prev, visible: false, confirmAction: null }));
  };

  const handleConfirmAlert = () => {
    const action = alert.confirmAction;
    setAlert((prev) => ({ ...prev, visible: false, confirmAction: null }));
    if (typeof action === 'function') {
      action();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Configurações de Conta</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Carregando informações...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Dados Gerais:</Text>
              <Pressable style={styles.editButton} onPress={toggleGeneralEdit}>
                <Ionicons name={isEditingGeneral ? 'close' : 'create-outline'} size={18} color="#ffffff" />
                <Text style={styles.editButtonText}>{isEditingGeneral ? 'Cancelar' : 'Editar'}</Text>
              </Pressable>
            </View>

            <View style={styles.photoContainer}>
              <PhotoPicker
                value={photo}
                onChange={setPhoto}
                onError={openError}
                editable={isEditingGeneral}
                size={96}
              />
              <Text style={styles.photoHelper}>
                {isEditingGeneral ? 'Toque para alterar a foto' : 'Foto de Perfil'}
              </Text>
            </View>

            <AuthTextInput label="Nome" value={nome} onChangeText={setNome} placeholder="Nome completo" editable={isEditingGeneral} />
            <AuthTextInput label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" editable={isEditingGeneral} />
            <AuthTextInput label="Telefone" value={telefone} onChangeText={(value) => setTelefone(formatTelefone(value))} placeholder="(11) 98877-6655" keyboardType="phone-pad" editable={isEditingGeneral} />
            <AuthTextInput label="CRP" value={crp} onChangeText={(value) => setCrp(formatCrp(value))} placeholder="06/123456" keyboardType="number-pad" editable={false} />

            <AuthButton label={savingGeneral ? 'Salvando...' : 'Salvar Alterações'} loading={savingGeneral} disabled={!isEditingGeneral} onPress={saveGeneral} style={styles.cardAction} />
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Gerenciamento de Acessos:</Text>
            </View>
            <Text style={{ marginBottom: 12, color: '#475569' }}>
              Adicione novos pacientes ou colegas psicólogos ao sistema.
            </Text>
            <AuthButton 
              label="Cadastrar Novo Usuário" 
              variant="secondary"
              onPress={() => setRegistroVisible(true)} 
            />
            {isAdmin && (
              <AuthButton 
                label="Gerenciar Permissões" 
                variant="secondary"
                style={{ marginTop: 8 }}
                onPress={openUserManagement} 
              />
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Alterar Senha:</Text>
              <Pressable style={styles.editButton} onPress={togglePasswordEdit}>
                <Ionicons name={isEditingPassword ? 'close' : 'lock-closed-outline'} size={18} color="#ffffff" />
                <Text style={styles.editButtonText}>{isEditingPassword ? 'Cancelar' : 'Editar'}</Text>
              </Pressable>
            </View>

            <AuthTextInput
              label="Senha Atual"
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              placeholder="Digite sua senha atual"
              secureTextEntry
              showToggle
              isVisible={showCurrentPassword}
              onToggleVisibility={() => setShowCurrentPassword((prev) => !prev)}
              editable={isEditingPassword}
            />

            <AuthTextInput
              label="Nova Senha"
              value={novaSenha}
              onChangeText={setNovaSenha}
              placeholder="Digite a nova senha"
              secureTextEntry
              showToggle
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((prev) => !prev)}
              editable={isEditingPassword}
            />

            <AuthTextInput
              label="Confirmar Nova Senha"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Confirme a nova senha"
              secureTextEntry
              showToggle
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((prev) => !prev)}
              editable={isEditingPassword}
            />

            {isEditingPassword ? (
              <>
                {confirmarSenha ? (
                  <Text style={[styles.matchText, { color: passwordsMatch ? '#16a34a' : '#ef4444' }]}>
                    {passwordsMatch ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                  </Text>
                ) : null}

                <PasswordStrengthIndicator password={novaSenha} minLength={12} />
              </>
            ) : null}

            <AuthButton label={savingPassword ? 'Alterando...' : 'Alterar Senha'} loading={savingPassword} disabled={!isEditingPassword} onPress={savePassword} style={styles.cardAction} />
          </View>
        </ScrollView>
      )}

      <RegistroModal
        visible={registroVisible}
        saving={registering}
        onClose={() => setRegistroVisible(false)}
        onSave={handleRegisterUser}
      />

      {/* Modal de Gestão de Usuários */}
      <Modal visible={usersVisible} animationType="slide" transparent onRequestClose={() => setUsersVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalHeader, { backgroundColor: '#1d4ed8' }]}>
              <Text style={styles.modalTitle}>Gerenciar Usuários</Text>
              <Pressable onPress={() => setUsersVisible(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
              {loadingUsers ? (
                <Text style={{ textAlign: 'center', marginVertical: 20 }}>Carregando...</Text>
              ) : (
                usersList.map((usr) => (
                  <View key={usr.id} style={styles.userListItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold' }}>{usr.nome || usr.name || usr.email}</Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>{usr.email}</Text>
                    </View>
                    <View style={styles.rolePickerWrapper}>
                      {['CLIENTE', 'PSICOLOGO', 'ADMIN'].map((r) => (
                        <Pressable 
                          key={r}
                          style={[
                            styles.roleBadge, 
                            (usr.role?.role || usr.role) === r && { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' }
                          ]}
                          onPress={() => handleChangeRole(usr, r)}
                        >
                          <Text style={[
                            styles.roleBadgeText,
                            (usr.role?.role || usr.role) === r && { color: '#fff' }
                          ]}>{r}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        primaryLabel={alert.confirmAction ? 'Sim' : 'OK'}
        secondaryLabel="Não"
        onClose={alert.confirmAction ? handleConfirmAlert : handleCloseAlert}
        onSecondaryAction={alert.confirmAction ? handleCloseAlert : undefined}
      />
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
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  photoButton: {
    position: 'relative',
  },
  profilePhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eef4fb',
    borderWidth: 2,
    borderColor: '#1d4ed8',
  },
  photoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eef2f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbe4f0',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1d4ed8',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoHelper: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#eef4fb',
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalContent: {
    padding: 16,
    gap: 8,
  },
  userListItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  rolePickerWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
});
