import { View, StyleSheet, ScrollView } from 'react-native';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';

export default function SearchItemScreen() {

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

      </ScrollView>
      <BottomBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
