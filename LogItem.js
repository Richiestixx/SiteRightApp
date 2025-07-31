import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Video } from 'lucide-react-native';
import { colors } from './styles.js'; // Import global styles

const LOG_PRIORITIES = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

const LogItem = ({ log, onMarkComplete, onPhotoPress }) => {
  const isCompleted = log.status === 'Completed';

  // Find the first video in the media array for the "View Reels" button logic
  const firstVideo = log.media?.find(m => m.type === 'video');

  return (
    <View style={[styles.card, isCompleted && styles.completedCard]}>
      <View style={styles.headerRow}>
        <Text style={styles.dateText}>
          {log.timestamp ? new Date(log.timestamp.toDate()).toLocaleString() : 'Just now'}
        </Text>
        <View style={[styles.priorityBadge, { backgroundColor: LOG_PRIORITIES[log.priority] }]}>
          <Text style={styles.priorityText}>{log.priority}</Text>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>Category: </Text>
        <Text style={[styles.detailValue, isCompleted && styles.strikethrough]}>{log.category}</Text>
      </View>
      {log.assignee && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Assigned To: </Text>
          <Text style={[styles.detailValue, isCompleted && styles.strikethrough]}>{log.assignee}</Text>
        </View>
      )}
      <Text style={[styles.notesText, isCompleted && styles.strikethrough]}>{log.notes}</Text>
      
      {/* **FIX:** Updated to read from the 'media' array */}
      {log.media && log.media.length > 0 && (
        <View style={styles.imageContainer}>
          {log.media.map((item, index) => (
            <Pressable key={index} onPress={() => onPhotoPress(log.media, index)}>
              {item.type === 'photo' ? (
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              ) : (
                <View style={styles.videoThumbnail}>
                  <Video size={32} color={colors.text} />
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
      
      {isCompleted ? (
        <View style={styles.completedBanner}>
            <Text style={styles.completedText}>
                Completed on {log.completedAt ? new Date(log.completedAt.toDate()).toLocaleDateString() : ''}
            </Text>
            {log.completionNotes && <Text style={styles.completedNotes}>Notes: {log.completionNotes}</Text>}
        </View>
      ) : (
        <Pressable 
            style={({pressed}) => [styles.completeButton, pressed && {opacity: 0.8}]}
            onPress={onMarkComplete}
        >
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 12, elevation: 2 },
  completedCard: { backgroundColor: '#f9fafb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dateText: { fontSize: 12, color: '#6b7280' },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  priorityText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  detailRow: { flexDirection: 'row', marginBottom: 4 },
  detailLabel: { fontWeight: '600', color: '#374151' },
  detailValue: { color: '#374151' },
  notesText: { marginTop: 8, fontSize: 16, color: '#111827' },
  strikethrough: { textDecorationLine: 'line-through', color: '#9ca3af' },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  thumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#f3f4f6' },
  videoThumbnail: { width: 80, height: 80, borderRadius: 8, marginRight: 8, marginBottom: 8, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  completeButton: { backgroundColor: '#22c55e', borderRadius: 6, paddingVertical: 10, marginTop: 16, alignItems: 'center' },
  completeButtonText: { color: 'white', fontWeight: 'bold' },
  completedBanner: { backgroundColor: '#dcfce7', borderRadius: 6, padding: 10, marginTop: 16 },
  completedText: { color: '#166534', fontWeight: 'bold' },
  completedNotes: { color: '#15803d', marginTop: 4, fontSize: 12 },
});

export default LogItem;



