import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';

export default function UserProfileScreen() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                Alert.alert('Erro', 'Usuário não encontrado.');
                setLoading(false);
                return;
            }

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', user.id)
                .single();

            if (profileError) {
                Alert.alert('Erro', 'Não foi possível carregar o perfil.');
                console.error(profileError.message);
                setLoading(false);
                return;
            }

            setProfile({
                name: profileData.full_name,
                email: user.email,
                phone: profileData.phone
            });
            setLoading(false);
        };

        fetchUserProfile();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#5db55b" />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Não foi possível carregar o perfil.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.label}>Nome:</Text>
                <Text style={styles.value}>{profile.name}</Text>
                <Text style={styles.label}>E-mail:</Text>
                <Text style={styles.value}>{profile.email}</Text>
                <Text style={styles.label}>Telefone:</Text>
                <Text style={styles.value}>{profile.phone}</Text>
            </View>
            <BottomBar />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'flex-start',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 10,
        color: '#555',
    },
    value: {
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
});

