import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Pressable, FlatList, ActivityIndicator, TextInput, ScrollView, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddLogForm from './AddLogForm';
import ReportingSection from './ReportingSection';
import CameraScreen from './CameraScreen';
import ReelsViewer from './ReelsViewer';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const Stack = createNativeStackNavigator();
const appId = 'default-site-right-v1-native';
const LOG_PRIORITIES = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

function ProjectListScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        const subscriber = auth().onAuthStateChanged(async (userState) => {
            const currentUser = userState || (await auth().signInAnonymously()).user;
            setUser(currentUser);
        });
        return subscriber;
    }, []);

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const unsubscribe = firestore()
            .collection(`artifacts/${appId}/users/${user.uid}/projects`)
            .orderBy('createdAt', 'desc')
            .onSnapshot(querySnapshot => {
                setProjects(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
                setIsLoading(false);
            });
        return unsubscribe;
    }, [user]);

    const handleAddProject = async () => {
        if (!newProjectName.trim() || !user || isCreating) return;
        setIsCreating(true);
        try {
            await firestore()
                .collection(`artifacts/${appId}/users/${user.uid}/projects`)
                .add({
                    name: newProjectName,
                    createdAt: new Date(),
                });
            setNewProjectName('');
        } catch(e) { console.error(e); } 
        finally { setIsCreating(false); }
    };

    if (isLoading || !user) {
        return <LoadingSpinner message="Loading Projects..." />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            <View style={styles.contentContainer}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Create New Project</Text>
                    <TextInput style={styles.input} placeholder="E.g., 123 Oak St. Kitchen" value={newProjectName} onChangeText={setNewProjectName} />
                    <Pressable style={({pressed}) => [styles.button, styles.buttonPrimary, pressed && {opacity: 0.8}]} onPress={handleAddProject} disabled={isCreating}>
                        <Text style={styles.buttonTextPrimary}>{isCreating ? 'Creating...' : 'Add Project'}</Text>
                    </Pressable>
                </View>
                <Text style={[styles.cardTitle, {marginTop: 20, marginBottom: 10}]}>Your Projects</Text>
                <FlatList
                    data={projects}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <Pressable style={({pressed}) => [styles.card, styles.projectItem, pressed && {backgroundColor: '#f0f0f0'}]} onPress={() => navigation.navigate('ProjectView', { project: item, userId: user.uid })}>
                            <Text style={styles.projectItemTitle}>{item.name}</Text>
                        </Pressable>
                    )}
                />
            </View>
        </SafeAreaView>
    );
}

function ProjectViewScreen({ route, navigation }) {
    const { project, userId } = route.params;
    const [logs, setLogs] = useState([]);
    const [isReelsVisible, setIsReelsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = firestore()
            .collection(`artifacts/${appId}/users/${userId}/projects`)
            .doc(project.id)
            .collection('logs')
            .onSnapshot(snapshot => {
                setLogs(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
            });
        return unsubscribe;
    }, [project.id, userId]);

    const handleMarkComplete = async (logItem) => {
        const logRef = firestore()
            .collection(`artifacts/${appId}/users/${userId}/projects/${project.id}/logs`)
            .doc(logItem.id);
        try {
            await logRef.update({ status: 'Completed' });
        } catch (error) { console.error("Failed to mark as complete:", error); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header />
            <ScrollView style={styles.contentContainer}>
                <Pressable style={({pressed}) => [styles.button, {marginBottom: 16, alignSelf: 'flex-start'}, pressed && {opacity: 0.8}]} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonText}>{'< Back to Projects'}</Text>
                </Pressable>
                <Text style={styles.pageTitle}>{project.name}</Text>
                <AddLogForm project={project} userId={userId} navigation={navigation} route={route} />
                <View style={styles.sectionHeader}>
                    <Text style={styles.cardTitle}>Snagging List</Text>
                    <Pressable onPress={() => setIsReelsVisible(true)}>
                        <Text style={styles.buttonText}>View Reels</Text>
                    </Pressable>
                </View>
                {logs.length > 0 ? logs.map(log => <LogItem key={log.id} log={log} />) : <Text style={styles.emptyText}>No logs yet.</Text>}
                <ReportingSection project={project} logs={logs} />
            </ScrollView>
            <ReelsViewer project={project} logs={logs} startIndex={0} isVisible={isReelsVisible} onClose={() => setIsReelsVisible(false)} onMarkComplete={handleMarkComplete} />
        </SafeAreaView>
    );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ProjectList" component={ProjectListScreen} />
        <Stack.Screen name="ProjectView" component={ProjectViewScreen} />
        <Stack.Screen name="CameraScreen" component={CameraScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const Header = () => <View style={styles.header}><Text style={styles.headerTitle}>Site Right</Text><Text style={styles.headerTagline}>site visits done right</Text></View>;
const LoadingSpinner = ({ message }) => <View style={styles.centerContainer}><ActivityIndicator size="large" color="#1e40af" /><Text style={styles.loadingText}>{message}</Text></View>;
const LogItem = ({ log }) => ( <View style={styles.card}><Text style={styles.logNotes}>{log.notes || 'No notes available.'}</Text>{log.priority && (<View style={styles.priorityContainer}><View style={[styles.priorityDot, {backgroundColor: LOG_PRIORITIES[log.priority] || '#ccc'}]} /><Text style={styles.priorityText}>{log.priority} Priority</Text></View>)}</View>);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  contentContainer: { flex: 1, padding: 16 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  headerTagline: { fontSize: 14, color: '#6b7280' },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 6, padding: 12, fontSize: 16, marginBottom: 12 },
  button: { borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  buttonPrimary: { backgroundColor: '#1e40af' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#1e40af' },
  buttonTextPrimary: { fontSize: 16, fontWeight: '600', color: 'white' },
  projectItem: { paddingVertical: 20 },
  projectItemTitle: { fontSize: 18, fontWeight: '500', color: '#1e40af' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6b7280' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  logNotes: { fontSize: 16, color: '#374151' },
  priorityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: '#f3f4f6' },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  priorityText: { marginLeft: 8, fontSize: 14, color: '#6b7280', fontWeight: '500' },
});










