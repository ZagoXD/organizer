import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { supabase } from '../supabase';
import BottomBar from '../components/BottomBar';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function NotificationsScreen() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(null);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('notifications-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                (payload) => {
                    console.log('Nova notificação recebida:', payload);
                    fetchNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    const fetchNotifications = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            Alert.alert('Erro', 'Usuário não autenticado.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            Alert.alert('Erro', 'Não foi possível carregar as notificações.');
            console.error(error.message);
        } else {
            setNotifications(data);
        }
        setLoading(false);
    };

    const handleMarkAsRead = async (id) => {
        setMarking(id);
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (error) {
            Alert.alert('Erro', 'Não foi possível marcar como lida.');
            console.error(error.message);
        } else {
            fetchNotifications();
        }
        setMarking(null);
    };

    const handleDelete = async (id) => {
        Alert.alert(
            'Excluir Notificação',
            'Tem certeza de que deseja excluir esta notificação?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    onPress: async () => {
                        const { error } = await supabase
                            .from('notifications')
                            .delete()
                            .eq('id', id);

                        if (error) {
                            Alert.alert('Erro', 'Não foi possível excluir a notificação.');
                            console.error(error.message);
                        } else {
                            fetchNotifications();
                        }
                    },
                },
            ],
            { cancelable: true }
        );
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, item.read && styles.readCard]}>
            <Text style={styles.message}>{item.message}</Text>
            <View style={styles.buttonRow}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleMarkAsRead(item.id)}
                    disabled={marking === item.id || item.read}
                >
                    {marking === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Icon
                            name={item.read ? 'done' : 'mark-email-read'}
                            size={20}
                            color="#fff"
                        />
                    )}
                    <Text style={styles.actionButtonText}>
                        {item.read ? 'Lida' : 'Marcar como lida'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#ff4d4d' }]}
                    onPress={() => handleDelete(item.id)}
                >
                    <Icon name="delete" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5db55b" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {notifications.length === 0 ? (
                <Text style={styles.emptyText}>Nenhuma notificação disponível.</Text>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
            <View style={styles.bottomBarContainer}>
                <BottomBar />
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    emptyText: {
        textAlign: 'center',
        color: '#777',
        fontSize: 16,
        marginTop: 50,
    },
    listContent: {
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
    },
    readCard: {
        opacity: 0.6,
    },
    message: {
        fontSize: 16,
        color: '#333',
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#5db55b',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginLeft: 10,
    },
    actionButtonText: {
        color: '#fff',
        marginLeft: 5,
        fontSize: 14,
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },

});
