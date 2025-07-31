import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { colors, typography, commonStyles } from './styles'; // Import global styles

const appId = 'default-site-right-v1-native';

const ProjectList = ({ navigation, projects, userId }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleAddProject = async () => {
    if (!newProjectName.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await firestore()
        .collection('artifacts').doc(appId)
        .collection('users').doc(userId)
        .collection('projects').add({
          name: newProjectName,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      setNewProjectName('');
    } catch (e) {
      console.error("Failed to create project", e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={commonStyles.card}>
        <Text style={typography.title3}>Create New Project</Text>
        <TextInput
          style={[commonStyles.input, { marginTop: 12 }]}
          placeholder="E.g., 123 Oak St. Kitchen"
          value={newProjectName}
          onChangeText={setNewProjectName}
        />
        <Pressable style={({ pressed }) => [commonStyles.button, commonStyles.buttonPrimary, { marginTop: 12 }, (isCreating || !newProjectName.trim()) && commonStyles.buttonDisabled, pressed && { opacity: 0.8 }]} onPress={handleAddProject} disabled={isCreating || !newProjectName.trim()}>
          <Text style={commonStyles.buttonTextPrimary}>{isCreating ? 'Creating...' : 'Add Project'}</Text>
        </Pressable>
      </View>
      <Text style={[typography.title3, { marginTop: 24, marginBottom: 8, paddingHorizontal: 4 }]}>Your Projects</Text>
      {projects.length === 0 ? (
        <Text style={{ textAlign: 'center', color: colors.text_secondary, marginTop: 20 }}>No projects yet. Create one to get started.</Text>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [commonStyles.card, { paddingVertical: 20 }, pressed && { backgroundColor: '#f0f0f0' }]}
              onPress={() => navigation.navigate('ProjectView', { project: item })}
            >
              <Text style={{ fontSize: 18, fontWeight: '500', color: colors.primary }}>{item.name}</Text>
              <Text style={[typography.caption, { marginTop: 4 }]}>Created: {item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'N/A'}</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
};

export default ProjectList;

