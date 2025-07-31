import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, Linking, AppState } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';
import { Circle, Video, Camera as CameraIcon } from 'lucide-react-native';
import { colors, typography, commonStyles } from './styles.js';

export default function CameraScreen({ navigation, route }) {
  const { project } = route.params;

  const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
  const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();

  const device = useCameraDevice('back');
  const camera = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState('photo');
  const [appState, setAppState] = useState(AppState.currentState);

  const requestPermissions = useCallback(async () => {
    await requestCameraPermission();
    await requestMicPermission();
  }, [requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    if (!hasCameraPermission) {
        requestPermissions();
    }
  }, [hasCameraPermission, requestPermissions]);

  const handleAppStateChange = useCallback((nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      requestCameraPermission();
      requestMicPermission();
    }
    setAppState(nextAppState);
  }, [appState, requestCameraPermission, requestMicPermission]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  const onRecordPressed = async () => {
    try {
      if (camera.current == null) {
        alert('Camera not ready. Please try again.');
        return;
      }
      
      if (isRecording) {
        await camera.current.stopRecording();
        return;
      }

      if (!hasMicPermission) {
        const granted = await requestMicPermission();
        if (!granted) {
          alert('Microphone permission is required for video recording');
          return;
        }
      }

      setIsRecording(true);
      await camera.current.startRecording({
        onRecordingFinished: (video) => {
          setIsRecording(false);
          // Navigate back to the project view with the new video
          navigation.navigate('ProjectView', {
            project: project,
            newMedia: { uri: 'file://' + video.path, type: 'video' }
          });
        },
        onRecordingError: (error) => {
          console.error('Recording error:', error);
          setIsRecording(false);
          alert('Failed to record video. Please try again.');
        },
        fileType: 'mp4',
        videoCodec: 'h264'
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
      alert('Failed to start recording. Please check camera permissions and try again.');
    }
  };

  const onPhotoPressed = async () => {
    if (camera.current == null || isRecording) return;
    try {
        const photo = await camera.current.takePhoto({
          qualityPrioritization: 'speed',
          flash: 'off',
          enableShutterSound: false,
        });
        // **FIX:** Navigate to the 'Main' stack first, then the 'ProjectView' screen inside it.
        navigation.navigate('Main', {
            screen: 'ProjectView',
            params: { project: project, newMedia: { uri: 'file://' + photo.path, type: 'photo' } },
            merge: true, // This merges the params instead of replacing them.
        });
    } catch(e) {
        console.error("Failed to take photo", e);
    }
  };

  if (!hasCameraPermission || !hasMicPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Permissions Required</Text>
            <Text style={styles.permissionText}>"Site Right" needs access to your camera and microphone to take photos and record videos.</Text>
            <Pressable style={({pressed}) => [commonStyles.button, commonStyles.buttonPrimary, pressed && {opacity: 0.8}]} onPress={requestPermissions}>
                <Text style={commonStyles.buttonTextPrimary}>Grant Permissions</Text>
            </Pressable>
            <Pressable style={{marginTop: 16}} onPress={() => Linking.openSettings()}>
                <Text style={styles.permissionLink}>Open Settings</Text>
            </Pressable>
        </View>
      </View>
    );
  }

  if (device == null) {
    return ( <View style={styles.container}><Text style={styles.permissionText}>No camera device found.</Text></View> );
  }

  return (
    <View style={styles.container}>
      <Camera ref={camera} style={StyleSheet.absoluteFill} device={device} isActive={true} photo={true} video={true} audio={true} />
      <View style={styles.controlsContainer}>
        <View style={styles.modeSwitcher}>
            <Pressable onPress={() => setMode('photo')} style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}>
                <CameraIcon color={mode === 'photo' ? 'black' : 'white'} size={28}/>
            </Pressable>
            <Pressable onPress={() => setMode('video')} style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}>
                <Video color={mode === 'video' ? 'black' : 'white'} size={28}/>
            </Pressable>
        </View>
        <Pressable style={styles.captureButton} onPress={mode === 'photo' ? onPhotoPressed : onRecordPressed}>
          {isRecording ? <View style={styles.stopButton} /> : <View style={styles.captureInnerButton} />}
        </Pressable>
        <View style={{width: 50}} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  permissionContainer: { padding: 24, backgroundColor: colors.surface, borderRadius: 12, margin: 20, alignItems: 'center' },
  permissionTitle: { ...typography.title2, marginBottom: 12 },
  permissionText: { ...typography.body, textAlign: 'center', marginBottom: 24, color: colors.text_secondary },
  permissionLink: { ...typography.body, color: colors.primary, textDecorationLine: 'underline' },
  controlsContainer: { position: 'absolute', bottom: 0, width: '100%', paddingVertical: 30, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.2)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  captureButton: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  captureInnerButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  stopButton: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'red' },
  modeSwitcher: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 30, padding: 4 },
  modeButton: { padding: 12 },
  modeButtonActive: { backgroundColor: 'white', borderRadius: 20 }
});





