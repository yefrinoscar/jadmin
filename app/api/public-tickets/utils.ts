/**
 * Utility functions for public tickets API
 */

/**
 * Converts a base64 string to a File object
 * @param base64Data - Base64 encoded data string
 * @param filename - Name for the resulting file
 * @returns Promise resolving to a File object
 */
export async function base64ToFile(base64Data: string, filename: string): Promise<File> {
  // Remove the data URL prefix and get just the base64 data
  const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to binary
  const binaryStr = atob(base64WithoutPrefix);
  const len = binaryStr.length;
  const arr = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    arr[i] = binaryStr.charCodeAt(i);
  }
  
  // Get mime type from data URL
  const mimeType = base64Data.match(/^data:([^;]+);/)?.[1] || 'image/png';
  
  // Create Blob and File
  const blob = new Blob([arr], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}
