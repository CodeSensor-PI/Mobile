import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

function getInitials(nomeCompleto) {
  const normalized = String(nomeCompleto || '').trim();
  if (!normalized) return 'P';
  const parts = normalized.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]).join('').toUpperCase();
}

export function PacienteCard({ paciente, primaryColor = '#1B66A4', onEdit, onSchedule, onDashboard, onReports }) {
  const nomeCompleto = String(paciente?.nomeCompleto || paciente?.nome || 'Paciente').trim();
  const telefone = paciente?.telefone || paciente?.dadosPaciente?.telefoneEmergencia || '--';
  const emergencia = paciente?.dadosPaciente?.contatoEmergencia || paciente?.dadosPaciente?.telefoneEmergencia || '--';

  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View style={[styles.avatar, { borderColor: primaryColor }]} accessibilityRole="image" accessibilityLabel={`Avatar de ${nomeCompleto}`}>
          <Text style={[styles.avatarText, { color: primaryColor }]}>{getInitials(nomeCompleto)}</Text>
        </View>

        <View style={styles.infoWrap}>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Nome: </Text>
            {nomeCompleto}
          </Text>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Telefone: </Text>
            {telefone}
          </Text>
          <Text style={styles.infoLine}>
            <Text style={styles.infoLabel}>Emergência: </Text>
            {emergencia}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionBtnOutline, { borderColor: primaryColor }]}
          onPress={onEdit}
          accessibilityRole="button"
          accessibilityLabel={`Editar dados do paciente ${nomeCompleto}`}
        >
          <Ionicons name="create-outline" size={14} color={primaryColor} />
          <Text style={[styles.actionBtnOutlineText, { color: primaryColor }]}>Editar</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtnSolid, { backgroundColor: primaryColor }]}
          onPress={onSchedule}
          accessibilityRole="button"
          accessibilityLabel={`Agendar consulta para ${nomeCompleto}`}
        >
          <Ionicons name="add" size={14} color="#ffffff" />
          <Text style={styles.actionBtnSolidText}>Agendar</Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.dashboardBtn, { borderColor: primaryColor, marginTop: 8 }]}
        onPress={onReports}
        accessibilityRole="button"
        accessibilityLabel={`Acessar relatórios do paciente ${nomeCompleto}`}
      >
        <MaterialCommunityIcons name="brain" size={14} color={primaryColor} />
        <Text style={[styles.dashboardBtnText, { color: primaryColor }]}>Relatórios de IA</Text>
      </Pressable>

      <Pressable
        style={[styles.dashboardBtn, { borderColor: primaryColor }]}
        onPress={onDashboard}
        accessibilityRole="button"
        accessibilityLabel={`Acessar dashboard do paciente ${nomeCompleto}`}
      >
        <Ionicons name="clipboard-outline" size={14} color={primaryColor} />
        <Text style={[styles.dashboardBtnText, { color: primaryColor }]}>Acessar Dashboard do paciente</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 12,
    gap: 10,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
  },
  infoWrap: {
    flex: 1,
    gap: 2,
  },
  infoLine: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 19,
  },
  infoLabel: {
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnOutline: {
    flex: 1,
    minHeight: 36,
    borderWidth: 1.2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#ffffff',
  },
  actionBtnOutlineText: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionBtnSolid: {
    flex: 1,
    minHeight: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnSolidText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  dashboardBtn: {
    minHeight: 36,
    borderWidth: 1.2,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#ffffff',
  },
  dashboardBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
