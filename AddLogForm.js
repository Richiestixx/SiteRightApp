import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Image, ActivityIndicator, ScrollView } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { Camera as CameraIcon, Video } from 'lucide-react-native';
import { colors, typography, commonStyles } from './styles';

const appId = 'default-site-right-v1-native';
const LOG_CATEGORIES = ['General', 'Cabinetry', 'Plumbing', 'Electrical', 'Paintwork', 'Appliance', 'Flooring', 'Tiling'];
const LOG_PRIORITIES = ['High', 'Medium', 'Low'];

const CustomSelector = ({ options, selectedValue, onValueChange }) => (
  <View style={styles.selectorContainer}>
    {options.map(option => (
      <Pressable key={option} onPress={() => onValueChange(option)} style={[styles.selectorOption, selectedValue === option && styles.selectorOptionSelected]}>
        <Text style={[styles.selectorText, selectedValue === option && styles.selectorTextSelected]}>{option}</Text>
      </Pressable>
    ))}
  </View>
);

export default function AddLogForm({ project, userId, navigation, route }) {
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [assignee, setAssignee] = useState('');
  const [media, setMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (route?.params?.newMedia) {
      setMedia(prevMedia => [...prevMedia, route.params.newMedia]);
      navigation.setParams({ newMedia: undefined });
    }
  }, [route?.params?.newMedia, navigation]);

  const removeMedia = (uri) => {
    setMedia(media.filter(m => m.uri !== uri));
  };

  const handleSubmit = async () => {
    if (!notes.trim() || media.length === 0) {
      alert('Please provide notes and at least one photo or video.');
      return;
    }
    setIsSubmitting(true);
    try {
      const mediaForDb = media.map(m => ({ uri: m.uri, type: m.type }));
      
      await firestore()
        .collection('artifacts')
        .doc(appId)
        .collection('users')
        .doc(userId)
        .collection('projects')
        .doc(project.id)
        .collection('logs')
        .add({
          notes, 
          priority, 
          category, 
          assignee, 
          media: mediaForDb, 
          status: 'To Do',
          timestamp: new Date(),
        });
        
      setNotes(''); setPriority('Medium'); setCategory('General'); setAssignee(''); setMedia([]);

    } catch (error) {
      console.error("Error adding log:", error);
      alert('Failed to add log item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={commonStyles.card}>
      <Text style={typography.title3}>Add New Log Item</Text>
      <Text style={styles.label}>Notes / Description</Text>
      <TextInput style={[commonStyles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Describe the issue..." value={notes} onChangeText={setNotes} multiline />
      
      <Text style={styles.label}>Photos & Videos ({media.length})</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ScrollView horizontal style={styles.mediaScrollView}>
            {media.map((item) => (
                <View key={item.uri} style={styles.mediaContainer}>
                    {item.type === 'photo' ? <Image source={{ uri: item.uri }} style={styles.thumbnail} /> : <View style={styles.videoThumbnail}><Video size={32} color={colors.text} /></View>}
                    <Pressable style={styles.removeMediaButton} onPress={() => removeMedia(item.uri)}><Text style={styles.removeMediaText}>X</Text></Pressable>
                </View>
            ))}
        </ScrollView>
        <Pressable style={styles.addMediaButton} onPress={() => navigation.navigate('CameraScreen', { project: project, userId: userId })}>
            <CameraIcon size={28} color={colors.text_secondary} />
        </Pressable>
      </View>

      <Text style={styles.label}>Priority</Text>
      <CustomSelector options={LOG_PRIORITIES} selectedValue={priority} onValueChange={setPriority} />
      <Text style={styles.label}>Category</Text>
      <CustomSelector options={LOG_CATEGORIES} selectedValue={category} onValueChange={setCategory} />
      <Text style={styles.label}>Assign To</Text>
      <TextInput style={commonStyles.input} placeholder="e.g., Plumber, John Smith" value={assignee} onChangeText={setAssignee} />
      <Pressable style={({ pressed }) => [commonStyles.button, commonStyles.buttonPrimary, (isSubmitting) && commonStyles.buttonDisabled, pressed && { opacity: 0.8 }]} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={commonStyles.buttonTextPrimary}>Add Log Item</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
    label: { ...typography.label, marginBottom: 6, marginTop: 16 },
    selectorContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    selectorOption: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#e5e7eb', marginRight: 8, marginBottom: 8 },
    selectorOptionSelected: { backgroundColor: colors.primary },
    selectorText: { color: colors.text },
    selectorTextSelected: { color: 'white' },
    mediaScrollView: { flex: 1, marginRight: 10 },
    addMediaButton: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
    mediaContainer: { width: 80, height: 80, borderRadius: 8, marginRight: 10, position: 'relative' },
    thumbnail: { width: '100%', height: '100%', borderRadius: 8 },
    videoThumbnail: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
    removeMediaButton: { position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 11, backgroundColor: 'red', justifyContent: 'center', alignItems: 'center', elevation: 3 },
    removeMediaText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
});






  



