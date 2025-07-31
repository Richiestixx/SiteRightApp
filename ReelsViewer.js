/**
 * ReelsViewer.js
 *
 * A full-screen, swipeable "Reels" style interface for viewing
 * video logs from a project. This version includes stability fixes.
 */
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions, FlatList, SafeAreaView, ActivityIndicator } from 'react-native';
import Video from 'react-native-video';
import { X, CheckSquare, MessageSquareText, BrainCircuit } from 'lucide-react-native';
import { colors, typography } from './styles.js';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import RNFS from 'react-native-fs';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const appId = 'default-site-right-v1-native';

// This component will render a single video page in the Reels viewer
const VideoPlayer = ({ item, isActive, onTranscribe, onComplete }) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(!isActive);
  const [isTranscribing, setIsTranscribing] = useState(false);

  React.useEffect(() => {
    setIsPaused(!isActive);
  }, [isActive]);

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleTranscription = async () => {
      setIsTranscribing(true);
      await onTranscribe(item);
      setIsTranscribing(false);
  }

  const checkFileExists = async (uri) => {
    try {
      const exists = await RNFS.exists(uri.replace('file://', ''));
      if (!exists) {
        alert('Video file not found. It may have been deleted or moved.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking file:', error);
      return false;
    }
  };

  const onError = async (error) => {
      console.error("Video Error:", error);
      const fileExists = await checkFileExists(item.uri);
      if (!fileExists) {
        alert("Video file not found. It may have been deleted from the cache.");
      } else {
        alert("Could not play this video file. The file may be corrupted.");
      }
  }

  return (
    <View style={styles.page}>
      <Pressable onPress={togglePause} style={StyleSheet.absoluteFill}>
        <Video
          ref={videoRef}
          source={{ uri: item.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
          repeat={true}
          paused={isPaused}
          onError={onError}
          bufferConfig={{
            minBufferMs: 15000,
            maxBufferMs: 50000,
            bufferForPlaybackMs: 2500,
            bufferForPlaybackAfterRebufferMs: 5000
          }}
        />
      </Pressable>
      
      <View style={styles.overlay}>
        <View style={styles.infoContainer}>
          <Text style={styles.notesTitle}>Notes:</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>

        <View style={styles.actionsContainer}>
            <Pressable style={styles.actionButton} onPress={() => onComplete(item)}>
                <CheckSquare size={32} color="white" />
                <Text style={styles.actionText}>Complete</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleTranscription} disabled={isTranscribing}>
                {isTranscribing ? <ActivityIndicator color="white" /> : <MessageSquareText size={32} color="white" />}
                <Text style={styles.actionText}>{isTranscribing ? 'Working...' : 'Transcribe'}</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => alert('Second Opinion coming soon!')}>
                <BrainCircuit size={32} color="white" />
                <Text style={styles.actionText}>2nd Opinion</Text>
            </Pressable>
        </View>
      </View>
    </View>
  );
};


const ReelsViewer = ({ project, logs, startIndex, isVisible, onClose, onMarkComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const videoLogs = logs
    .map(log => {
        const videos = log.media?.filter(m => m.type === 'video');
        return videos?.length > 0 ? { ...log, uri: videos[0].uri } : null;
    })
    .filter(Boolean);

  const handleTranscriptionRequest = async (logItem) => {
      if (!logItem.uri) return;
      const videoUri = logItem.uri.replace('file://', '');
      try {
          const videoBase64 = await RNFS.readFile(videoUri, 'base64');
          const prompt = "Transcribe the speech in this video. The user is a kitchen/bathroom fitter describing an issue on a job site. Clean up the language to be professional and clear, suitable for a report. Only return the transcribed text.";
          const payload = { contents: [{ role: "user", parts: [{ text: prompt }, { inlineData: { mimeType: "video/mp4", data: videoBase64 } }] }] };
          const apiKey = "";
          const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
          const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!response.ok) {
              const errorBody = await response.text();
              throw new Error(`API Error: ${response.status} ${errorBody}`);
          }
          const result = await response.json();
          const transcription = result.candidates?.[0]?.content?.parts?.[0]?.text;

          if (transcription) {
              const userId = auth().currentUser.uid;
              const logRef = firestore().collection('artifacts').doc(appId).collection('users').doc(userId).collection('projects').doc(project.id).collection('logs').doc(logItem.id);
              await logRef.update({
                  notes: `${logItem.notes}\n\n--- AI Transcription ---\n${transcription}`
              });
              alert('Transcription added to notes!');
          } else {
              throw new Error("No transcription found in API response.");
          }
      } catch (error) {
          console.error("Transcription failed:", error);
          alert(`Transcription failed: ${error.message}`);
      }
  };

  if (!isVisible || videoLogs.length === 0) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <FlatList
          data={videoLogs}
          renderItem={({ item, index }) => (
            <VideoPlayer 
                item={item} 
                isActive={index === currentIndex} 
                onTranscribe={handleTranscriptionRequest}
                onComplete={onMarkComplete}
            />
          )}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          initialScrollIndex={startIndex}
          getItemLayout={(data, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X size={32} color="white" />
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: { flex: 1, backgroundColor: 'black' },
  page: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: 'center', alignItems: 'center' },
  closeButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  infoContainer: { flex: 1 },
  notesTitle: { ...typography.label, color: 'white', fontWeight: 'bold' },
  notesText: { ...typography.body, color: 'white', marginTop: 4 },
  actionsContainer: { marginLeft: 20, alignItems: 'center' },
  actionButton: { alignItems: 'center', marginBottom: 24 },
  actionText: { ...typography.caption, color: 'white', marginTop: 4 },
});

export default ReelsViewer;



