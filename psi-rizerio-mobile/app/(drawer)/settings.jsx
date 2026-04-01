import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { CustomAlert } from '../../components/CustomAlert';
import { useRouter } from 'expo-router';

const MOCK_PROFILE = {
  name: "João Silva",
  email: "joaosilva@gmail.com",
  birthDate: "22/12/2003",
  cpf: "123.456.789-10",
  phone: "(11) 91234-5678",
  city: "São Paulo",
  emergencyContact: {
    name: "Nome do Contato da Silva",
    phone: "(11) 94321-8765"
  },
  consultation: {
    preferredDays: "Quinta-Feira",
    preferredTimes: "11:30",
    reason: "Lorem ipsum dolor sit amet. Qui ducimus vitae eum illo eveniet rem voluptas iure qui quas quia aut animi recusandae ea tempora repellat"
  }
};

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();

  const [profileData, setProfileData] = useState(MOCK_PROFILE);
  const [alertVisible, setAlertVisible] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const handleEditToggle = (sectionId) => {
    if (editingSection === sectionId) {
      // Transitioning from Edit to View - "Save" action
      setAlertVisible(true);
      setEditingSection(null);
    } else {
      setEditingSection(sectionId);
    }
  };

  const updateField = (field, value, subfield) => {
    setProfileData(prev => {
      if (subfield) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [subfield]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const Section = ({ id, title, children, showEdit }) => {
    const isEditing = editingSection === id;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
          {showEdit && (
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: isEditing ? '#4CAF50' : colors.primary }]} 
              onPress={() => handleEditToggle(id)}
            >
              <IconSymbol name={isEditing ? "checkmark" : "pencil"} size={14} color="#FFF" />
              <ThemedText style={styles.editButtonText}>{isEditing ? "Salvar" : "Editar"}</ThemedText>
            </TouchableOpacity>
          )}
        </View>
        {children}
      </View>
    );
  };

  const InfoRow = ({ sectionId, label, value, field, subfield }) => {
    const isEditing = editingSection === sectionId;
    
    return (
      <View style={styles.infoRowContainer}>
        <ThemedText style={styles.rowLabel}>{label}:</ThemedText>
        {isEditing ? (
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.primary }]}
            value={value}
            onChangeText={(val) => updateField(field, val, subfield)}
            placeholder={label}
            placeholderTextColor="#999"
          />
        ) : (
          <ThemedText style={[styles.rowValue, { color: colors.textSecondary }]}>{value}</ThemedText>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Section id="personal" title="Informações pessoais" showEdit>
          <View style={styles.profileRow}>
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={styles.avatarPlaceholder} 
            />
            <View style={styles.avatarActions}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.purpleLight }]}>
                <IconSymbol name="square.and.arrow.up" size={16} color="#FFF" />
                <ThemedText style={styles.actionButtonText}>Carregar foto</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
                <IconSymbol name="trash" size={16} color="#FFF" />
                <ThemedText style={styles.actionButtonText}>Remover foto</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
          <InfoRow sectionId="personal" label="Nome" value={profileData.name} field="name" />
          <InfoRow sectionId="personal" label="Email" value={profileData.email} field="email" />
          <InfoRow sectionId="personal" label="Data de Nascimento" value={profileData.birthDate} field="birthDate" />
          <InfoRow sectionId="personal" label="CPF" value={profileData.cpf} field="cpf" />
          <InfoRow sectionId="personal" label="Telefone" value={profileData.phone} field="phone" />
          <InfoRow sectionId="personal" label="Cidade" value={profileData.city} field="city" />
        </Section>
 
        <Section id="emergency" title="Contato de emergência" showEdit>
          <InfoRow sectionId="emergency" label="Nome" value={profileData.emergencyContact.name} field="emergencyContact" subfield="name" />
          <InfoRow sectionId="emergency" label="Telefone de emergência" value={profileData.emergencyContact.phone} field="emergencyContact" subfield="phone" />
        </Section>
 
        <Section id="consultation" title="Consulta" showEdit>
          <InfoRow sectionId="consultation" label="Dias ideais para consultas" value={profileData.consultation.preferredDays} field="consultation" subfield="preferredDays" />
          <InfoRow sectionId="consultation" label="Horários ideais para consultas" value={profileData.consultation.preferredTimes} field="consultation" subfield="preferredTimes" />
          <ThemedText style={[styles.rowLabel, { marginTop: 10 }]}>Motivo de consulta:</ThemedText>
          {editingSection === 'consultation' ? (
            <TextInput
              style={[styles.input, styles.textArea, { color: colors.text, borderColor: colors.primary }]}
              value={profileData.consultation.reason}
              onChangeText={(val) => updateField('consultation', val, 'reason')}
              multiline
              numberOfLines={4}
            />
          ) : (
            <ThemedText style={[styles.longValue, { color: colors.textSecondary }]}>
              {profileData.consultation.reason}
            </ThemedText>
          )}
        </Section>

        <TouchableOpacity 
          style={[styles.passwordButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/change-password')}
        >
          <IconSymbol name="lock" size={18} color="#FFF" />
          <ThemedText style={styles.passwordButtonText}>Alterar Senha</ThemedText>
        </TouchableOpacity>

        <CustomAlert 
          visible={alertVisible}
          title="Salvo"
          message="Suas alterações foram salvas com sucesso!"
          onClose={() => setAlertVisible(false)}
        />

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  profileRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 15,
  },
  avatarActions: {
    marginLeft: 20,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 12,
  },
  infoRowContainer: {
    marginBottom: 10,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  rowValue: {
    fontWeight: '300',
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    marginTop: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  longValue: {
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 22,
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  passwordButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});
