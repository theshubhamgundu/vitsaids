// src/lib/SupabaseDataManager.ts
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid'; // To generate unique IDs for new entries if needed on the client

// Generic interface for content that will be stored in Supabase tables
interface BaseContentItem {
  id?: string; // Supabase usually generates this, but useful for updates
  created_at?: string; // Supabase also generates this
  [key: string]: any; // Allows for other dynamic properties
}

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  bucketName: string,
  file: File,
  folderPath: string = '' // e.g., 'events_images', 'faculty_photos'
): Promise<{ publicUrl: string | null; filePath: string | null; error: Error | null }> {
  const fileExtension = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExtension}`;
  const pathInStorage = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(pathInStorage, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) {
    console.error(`Error uploading file to ${bucketName}/${pathInStorage}:`, error.message);
    return { publicUrl: null, filePath: null, error };
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(pathInStorage);

  if (!publicUrlData || publicUrlData.publicUrl.includes('null')) {
    // Supabase can sometimes return a publicUrl with 'null' if the path is invalid or upload failed silently
    return { publicUrl: null, filePath: pathInStorage, error: new Error('Failed to get public URL for uploaded file.') };
  }

  return { publicUrl: publicUrlData.publicUrl, filePath: pathInStorage, error: null };
}

/**
 * Deletes a file from a specified Supabase Storage bucket.
 */
export async function deleteFile(
  bucketName: string,
  filePath: string // This should be the path within the bucket, not the public URL
): Promise<{ success: boolean; error: Error | null }> {
  // Extract path if a public URL is mistakenly passed
  let pathToDelete = filePath;
  if (filePath.includes('.supabase.co/storage/v1/object/public/')) {
    const parts = filePath.split('.supabase.co/storage/v1/object/public/');
    if (parts.length > 1) {
      // Assuming the format is bucketName/folder/fileName
      const pathAfterPublic = parts[1];
      const pathParts = pathAfterPublic.split('/');
      if (pathParts.length > 1 && pathParts[0] === bucketName) { // Check if bucket name matches
        pathToDelete = pathParts.slice(1).join('/'); // Get the path relative to the bucket
      } else {
        console.warn(`Attempted to delete file from incorrect bucket or malformed URL: ${filePath}`);
        return { success: false, error: new Error('Malformed file path or incorrect bucket for deletion.') };
      }
    }
  }


  const { error } = await supabase.storage.from(bucketName).remove([pathToDelete]);

  if (error) {
    // Handle case where file might already be gone (e.g., if re-upload with upsert failed)
    if (error.statusCode === '404' || error.message.includes('Object not found')) {
      console.warn(`File not found during deletion, likely already removed: ${bucketName}/${pathToDelete}`);
      return { success: true, error: null }; // Treat as success if file already doesn't exist
    }
    console.error(`Error deleting file from Supabase Storage (${bucketName}/${pathToDelete}):`, error.message);
    return { success: false, error };
  }
  return { success: true, error: null };
}

/**
 * Fetches all entries from a Supabase table.
 */
export async function fetchAllEntries<T extends BaseContentItem>(tableName: string): Promise<T[] | null> {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false }); // Or another relevant ordering column

  if (error) {
    console.error(`Error fetching entries from ${tableName}:`, error.message);
    return null;
  }
  return data as T[];
}

/**
 * Adds a new entry to a Supabase table.
 */
export async function addEntry<T extends BaseContentItem>(tableName: string, entry: Omit<T, 'id' | 'created_at'>): Promise<T | null> {
  const { data, error } = await supabase
    .from(tableName)
    .insert([entry])
    .select(); // Use .select() to return the newly inserted data

  if (error) {
    console.error(`Error adding entry to ${tableName}:`, error.message);
    return null;
  }
  return data ? data[0] as T : null;
}

/**
 * Updates an existing entry in a Supabase table.
 */
export async function updateEntry<T extends BaseContentItem>(tableName: string, id: string, updates: Partial<T>): Promise<T | null> {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error(`Error updating entry in ${tableName} (ID: ${id}):`, error.message);
    return null;
  }
  return data ? data[0] as T : null;
}

/**
 * Deletes an entry from a Supabase table.
 */
export async function deleteEntry(tableName: string, id: string): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting entry from ${tableName} (ID: ${id}):`, error.message);
    return { success: false, error };
  }
  return { success: true, error: null };
}
