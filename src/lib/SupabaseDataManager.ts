// src/lib/SupabaseDataManager.ts
import { supabaseOld } from '@/integrations/supabase/supabaseOld'; // Import the old client
import { supabaseNew } from '@/integrations/supabase/supabaseNew'; // Import the new client
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type
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
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function uploadFile(
    bucketName: string,
    file: File,
    folderPath: string = '', // e.g., 'events_images', 'faculty_photos'
    client: SupabaseClient // Add client as a parameter
): Promise<{ publicUrl: string | null; filePath: string | null; error: Error | null }> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const pathInStorage = folderPath ? `${folderPath}/${fileName}` : fileName;

    const { data, error } = await client.storage // Use the passed client
        .from(bucketName)
        .upload(pathInStorage, file, {
            upsert: true,
            contentType: file.type,
        });

    if (error) {
        console.error(`Error uploading file to ${bucketName}/${pathInStorage} with client:`, error.message);
        return { publicUrl: null, filePath: null, error };
    }

    const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(pathInStorage); // Use the passed client

    if (!publicUrlData || publicUrlData.publicUrl.includes('null')) {
        return { publicUrl: null, filePath: pathInStorage, error: new Error('Failed to get public URL for uploaded file.') };
    }

    return { publicUrl: publicUrlData.publicUrl, filePath: pathInStorage, error: null };
}

/**
 * Deletes a file from a specified Supabase Storage bucket.
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function deleteFile(
    bucketName: string,
    filePath: string, // This should be the path within the bucket, not the public URL
    client: SupabaseClient // Add client as a parameter
): Promise<{ success: boolean; error: Error | null }> {
    // Extract path if a public URL is mistakenly passed
    let pathToDelete = filePath;
    if (filePath.includes('.supabase.co/storage/v1/object/public/')) {
        const parts = filePath.split('.supabase.co/storage/v1/object/public/');
        if (parts.length > 1) {
            const pathAfterPublic = parts[1];
            const pathParts = pathAfterPublic.split('/');
            // This logic is a bit brittle, relies on URL structure. Better to pass clean path directly.
            // For robustness, you might want to consider how the original `filePath` is stored.
            // Assuming the first part is bucketName and the rest is the path within the bucket
            if (pathParts.length > 1 && pathParts[0] === bucketName) {
                pathToDelete = pathParts.slice(1).join('/');
            } else if (pathParts.length === 1 && pathParts[0] === bucketName) {
                 // For root-level files in the bucket, pathParts might just be the file name.
                 pathToDelete = ''; // If the public URL refers directly to a file at the root of the bucket, path might be empty string for .remove().
                 console.warn(`Unexpected public URL structure for deletion: ${filePath}. Attempting root-level file deletion.`);
            } else {
                console.warn(`Attempted to delete file from incorrect bucket or malformed URL: ${filePath}`);
                return { success: false, error: new Error('Malformed file path or incorrect bucket for deletion.') };
            }
        }
    }


    const { error } = await client.storage.from(bucketName).remove([pathToDelete]); // Use the passed client

    if (error) {
        if (error.statusCode === '404' || error.message.includes('Object not found')) {
            console.warn(`File not found during deletion, likely already removed: ${bucketName}/${pathToDelete}`);
            return { success: true, error: null };
        }
        console.error(`Error deleting file from Supabase Storage (${bucketName}/${pathToDelete}) with client:`, error.message);
        return { success: false, error };
    }
    return { success: true, error: null };
}

/**
 * Fetches all entries from a Supabase table.
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function fetchAllEntries<T extends BaseContentItem>(tableName: string, client: SupabaseClient): Promise<T[] | null> {
    const { data, error } = await client // Use the passed client
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(`Error fetching entries from ${tableName} with client:`, error.message);
        return null;
    }
    return data as T[];
}

/**
 * Adds a new entry to a Supabase table.
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function addEntry<T extends BaseContentItem>(tableName: string, entry: Omit<T, 'id' | 'created_at'>, client: SupabaseClient): Promise<T | null> {
    const { data, error } = await client // Use the passed client
        .from(tableName)
        .insert([entry])
        .select();

    if (error) {
        console.error(`Error adding entry to ${tableName} with client:`, error.message);
        return null;
    }
    return data ? data[0] as T : null;
}

/**
 * Updates an existing entry in a Supabase table.
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function updateEntry<T extends BaseContentItem>(tableName: string, id: string, updates: Partial<T>, client: SupabaseClient): Promise<T | null> {
    const { data, error } = await client // Use the passed client
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select();

    if (error) {
        console.error(`Error updating entry in ${tableName} (ID: ${id}) with client:`, error.message);
        return null;
    }
    return data ? data[0] as T : null;
}

/**
 * Deletes an entry from a Supabase table.
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function deleteEntry(tableName: string, id: string, client: SupabaseClient): Promise<{ success: boolean; error: Error | null }> {
    const { error } = await client // Use the passed client
        .from(tableName)
        .delete()
        .eq('id', id);

    if (error) {
        console.error(`Error deleting entry from ${tableName} (ID: ${id}) with client:`, error.message);
        return { success: false, error };
    }
    return { success: true, error: null };
}
