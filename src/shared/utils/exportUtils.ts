import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export async function exportHtmlToPdf(html: string, filename = 'reporte-ecoruteando.pdf'): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      await Print.printAsync({ html });
      return true;
    }

    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);

    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        UTI: '.pdf',
        dialogTitle: 'Exportar a PDF',
      });
      return true;
    } else {
      await Print.printAsync({ html });
      return true;
    }
  } catch (err) {
    console.warn('[exportHtmlToPdf] Error:', err);
    throw err;
  }
}

export async function exportCsvOrExcel(csvContent: string, filename = 'ecoruteando-datos.csv'): Promise<string | boolean> {
  try {
    const withBom = csvContent.startsWith('\uFEFF') ? csvContent : '\uFEFF' + csvContent;

    if (Platform.OS === 'web') {
      const blob = new Blob([withBom], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', filename);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return true;
    }

    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
    const fileUri = `${baseDir}${filename}`;

    await FileSystem.writeAsStringAsync(fileUri, withBom, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar Excel (CSV)',
      });
      return true;
    }

    return fileUri;
  } catch (err) {
    console.warn('[exportCsvOrExcel] Error:', err);
    throw err;
  }
}
