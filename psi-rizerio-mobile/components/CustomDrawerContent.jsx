import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { isClienteRole } from '../constants/role-theme';

export function CustomDrawerContent(props) {
  const { primaryColor = '#1B66A4', role } = props;
  const isCliente = isClienteRole(role);
  const activeRoute = props.state.routes[props.state.index];
  let headerTitle = isCliente ? 'Home' : 'Dashboard';
  
  if (activeRoute.name === 'agendamentos') headerTitle = isCliente ? 'Meus Agendamentos' : 'Agendamentos';
  else if (activeRoute.name === 'pacientes') headerTitle = 'Meus Pacientes';
  else if (activeRoute.name === 'settings') headerTitle = 'Configurações';
  else if (activeRoute.name === 'feedback') headerTitle = 'Feedbacks';
  else if (activeRoute.name === 'psicologos') headerTitle = 'Psicólogos';
  else if (activeRoute.name === 'administracao') headerTitle = 'Administração';
  else if (activeRoute.name === 'change-password') headerTitle = 'Alterar Senha';
  else if (activeRoute.name === 'logout') headerTitle = 'Sair';

  const menuItems = isCliente
    ? [
        { name: 'index', label: 'Home', iconName: 'house' },
        { name: 'settings', label: 'Configurações', iconName: 'gear' },
        { name: 'agendamentos', label: 'Meus Agendamentos', iconName: 'calendar' },
        { name: 'feedback', label: 'Feedbacks', iconName: 'bubble.left.and.bubble.right' },
      ]
    : [
        { name: 'index', label: 'Dashboard', iconName: 'house' },
        { name: 'agendamentos', label: 'Agendamentos', iconName: 'calendar' },
        { name: 'pacientes', label: 'Meus Pacientes', iconName: 'person.2' },
        { name: 'psicologos', label: 'Psicólogos', iconName: 'person.3' },
        { name: 'administracao', label: 'Administração', iconName: 'gear' },
      ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: primaryColor }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => props.navigation.closeDrawer()}>
          <IconSymbol name="xmark" size={24} color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{headerTitle}</ThemedText>
      </View>

      <View style={styles.menuContainer}>
        {menuItems.map((item) => {
          const route = props.state.routes.find((entry) => entry.name === item.name);
          if (!route) return null;

          const isFocused = activeRoute.name === item.name;

          return (
            <TouchableOpacity 
              key={route.key}
              style={[
                styles.menuItem, 
                isFocused && { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15 }
              ]} 
              onPress={() => props.navigation.navigate(item.name)}
            >
              <IconSymbol name={item.iconName} size={24} color="#FFF" />
              <ThemedText style={styles.menuText}>{item.label}</ThemedText>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => props.navigation.navigate('logout')}
        >
          <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#FFF" />
          <ThemedText style={styles.menuText}>Sair</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  menuContainer: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 5,
  },
  menuText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 15,
  },
});
