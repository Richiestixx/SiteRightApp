/**
 * ReportingSection.js
 *
 * This component generates and shares a native PDF report.
 * It converts project data into an HTML string and uses a native
 * library to create a PDF file from that HTML.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';

import RNFS from 'react-native-fs';

// Import the native libraries we just installed
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

// --- Constants ---
const LOG_PRIORITIES = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };
const PRIORITY_ORDER = { 'High': 1, 'Medium': 2, 'Low': 3 };

const ReportingSection = ({ project, logs }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Creates an HTML string that represents the PDF report content.
   * This is a powerful way to style our PDF using familiar CSS.
   */
  const createHtmlForPdf = () => {
    // Sort logs for the report: Completed items last, then by priority
    const sortedLogs = [...logs].sort((a,b) => (a.status === 'Completed' ? 1 : -1) - (b.status === 'Completed' ? 1 : -1) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

    // Generate table rows from log data
    const tableRows = sortedLogs.map(log => `
      <tr class="${log.status === 'Completed' ? 'completed' : ''}">
        <td><span class="priority-dot" style="background-color: ${LOG_PRIORITIES[log.priority] || '#888'}"></span> ${log.priority}</td>
        <td>${log.category}</td>
        <td>${log.assignee || 'N/A'}</td>
        <td>${log.notes} ${log.completionNotes ? `<br><small><em>Completion: ${log.completionNotes}</em></small>` : ''}</td>
      </tr>
    `).join('');

    // Generate image sections
    const imageSections = sortedLogs.map(log => {
      if (log.status === 'Completed' || !log.imageDataUrls || log.imageDataUrls.length === 0) {
        return '';
      }
      const images = log.imageDataUrls.map(uri => `<img src="${uri}" alt="Annotated photo" />`).join('');
      return `
        <div class="image-section">
          <h3>Item: ${log.notes.substring(0, 50)}...</h3>
          <div class="image-container">${images}</div>
        </div>
      `;
    }).join('');

    // The complete HTML document string
    return `
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #333; }
            h1 { font-size: 24px; color: #1e40af; }
            h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-break: break-word; }
            th { background-color: #1e40af; color: white; }
            .priority-dot { height: 10px; width: 10px; border-radius: 5px; display: inline-block; margin-right: 5px; }
            .completed { color: #888; background-color: #f9f9f9; }
            .completed td { text-decoration: line-through; }
            .page-break { page-break-after: always; }
            .image-section { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 15px; }
            .image-container { display: flex; flex-wrap: wrap; }
            img { width: 100%; height: auto; margin-top: 10px; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>Site Right Report</h1>
          <h2>Project: ${project.name}</h2>
          <p>Report generated on: ${new Date().toLocaleString()}</p>
          
          <h3>Snagging List Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Category</th>
                <th>Assigned To</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="page-break"></div>

          <h2>Annotated Photos</h2>
          ${imageSections}
        </body>
      </html>
    `;
  };

  const generateAndSharePdf = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Request storage permission on Android
      if (Platform.OS === 'android') {
        const readGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to share the PDF',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        const writeGranted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to your storage to share the PDF',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (
          readGranted !== PermissionsAndroid.RESULTS.GRANTED ||
          writeGranted !== PermissionsAndroid.RESULTS.GRANTED
        ) {
          throw new Error('Storage permission denied');
        }
      }

      const htmlContent = createHtmlForPdf();
      const options = {
        html: htmlContent,
        fileName: `SiteRight_Report_${project.name.replace(/\s/g, '_')}`,
        directory: 'Documents', // A common directory
      };

      const file = await RNHTMLtoPDF.convert(options);
      console.log('PDF Generated:', file.filePath);

      if (!file || !file.filePath) {
        throw new Error('PDF file was not created.');
      }

      // Check if file exists
      const fileExists = await RNFS.exists(file.filePath);
      if (!fileExists) {
        throw new Error('PDF file does not exist at path: ' + file.filePath);
      }

      const fileUri = `file://${file.filePath}`;
      await Share.open({
        title: `Site Right Report: ${project.name}`,
        url: fileUri,
        subject: `Report for ${project.name}`,
      });

    } catch (error) {
      console.error('PDF Generation/Share Error:', error);
      // Optionally show an alert to the user
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Reporting & Actions</Text>
      <Pressable 
        style={({pressed}) => [styles.button, styles.buttonPrimary, (isGenerating || logs.length === 0) && styles.buttonDisabled, pressed && {opacity: 0.8}]} 
        onPress={generateAndSharePdf}
        disabled={isGenerating || logs.length === 0}
      >
        {isGenerating ? (
            <ActivityIndicator color="white" />
        ) : (
            <Text style={styles.buttonTextPrimary}>Generate & Share Report</Text>
        )}
      </Pressable>
      {logs.length === 0 && <Text style={styles.emptyText}>Add a log item to enable reporting.</Text>}
    </View>
  );
};

// --- Styles for this component ---
const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    button: {
        borderRadius: 6,
        paddingVertical: 12,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: '#1e40af',
    },
    buttonTextPrimary: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b7280',
        marginTop: 10,
        fontSize: 12,
    }
});

export default ReportingSection;
