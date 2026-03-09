import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { ThemedText } from './themed-text';
import { IconSymbol } from './ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function CustomDrawerContent(props: DrawerContentComponentProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const activeRoute = props.state.routes[props.state.index];
  let headerTitle = 'Meus Agendamentos';
  
  if (activeRoute.name === 'settings') headerTitle = 'Configurações';
  else if (activeRoute.name === 'feedback') headerTitle = 'Feedbacks';
  else if (activeRoute.name === 'change-password') headerTitle = 'Alterar Senha';
  else if (activeRoute.name === 'logout') headerTitle = 'Sair';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#C0ADEF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => props.navigation.closeDrawer()}>
          <IconSymbol name="xmark" size={24} color="#FFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>{headerTitle}</ThemedText>
      </View>

      <View style={styles.menuContainer}>
        {props.state.routes.map((route, index) => {
          const isFocused = props.state.index === index;
          
          let iconName: any = 'house';
          let label = '';
          
          if (route.name === 'index') {
            iconName = 'house';
            label = 'Home';
          } else if (route.name === 'settings') {
            iconName = 'gear';
            label = 'Configurações';
          } else if (route.name === 'feedback') {
            iconName = 'doc.text';
            label = 'Feedbacks';
          } else {
            return null; // Skip routes we don't want in the main menu
          }

          return (
            <TouchableOpacity 
              key={route.key}
              style={[
                styles.menuItem, 
                isFocused && { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 15 }
              ]} 
              onPress={() => props.navigation.navigate(route.name)}
            >
              <IconSymbol name={iconName} size={24} color="#FFF" />
              <ThemedText style={styles.menuText}>{label}</ThemedText>
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
