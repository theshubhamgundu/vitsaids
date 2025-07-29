// src/lib/SupabaseDataManager.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid'; // For unique file names

// Generic interface for content that will be stored in Supabase tables
interface BaseContentItem {
    id?: string;
    created_at?: string;
    [key: string]: any;
}

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * Returns the public URL and storage path of the uploaded file.
 */
export async function uploadFile(
    bucketName: string,
    file: File,
    // The `filePath` parameter here is intended to be the FULL path within the bucket,
    // e.g., 'events/unique-uuid_image.png' or 'profile_photos/user-id/photo.jpg'.
    // It should already contain subfolders if desired.
    filePathInBucket: string, // Changed parameter name for clarity
    supabase: SupabaseClient
): Promise<{ publicUrl: string | null; filePath: string | null; error: Error | null }> {
    console.log(`[SupabaseDataManager] uploadFile: Attempting to upload to bucket "${bucketName}" at path "${filePathInBucket}"`);
    try {
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePathInBucket, file, {
                cacheControl: '3600',
                upsert: true, // Typically true for overwriting in profile photos, false for new unique files
                contentType: file.type,
            });

        if (error) {
            console.error(`[SupabaseDataManager] uploadFile Error for bucket "${bucketName}" path "${filePathInBucket}":`, error);
            // Log full error details if available
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            return { publicUrl: null, filePath: null, error: error };
        }

        const { data: publicUrlData, error: publicUrlError } = supabase.storage.from(bucketName).getPublicUrl(filePathInBucket);

        if (publicUrlError || !publicUrlData || !publicUrlData.publicUrl || publicUrlData.publicUrl.includes('null')) {
            console.error(`[SupabaseDataManager] uploadFile Error getting public URL for path "${filePathInBucket}":`, publicUrlError);
            return { publicUrl: null, filePath: filePathInBucket, error: publicUrlError || new Error('Failed to retrieve public URL after upload.') };
        }

        console.log(`[SupabaseDataManager] uploadFile Success for bucket "${bucketName}" path "${filePathInBucket}"`);
        console.log(`[SupabaseDataManager] uploadFile Public URL:`, publicUrlData.publicUrl);
        return { publicUrl: publicUrlData.publicUrl, filePath: data?.path || filePathInBucket, error: null };

    } catch (e: any) {
        console.error(`[SupabaseDataManager] uploadFile Caught Exception for bucket "${bucketName}" path "${filePathInBucket}":`, e);
        return { publicUrl: null, filePath: null, error: e };
    }
};

/**
 * Deletes a file from a specified Supabase Storage bucket.
 * Accepts a SupabaseClient instance to determine which database to use.
 */
export async function deleteFile(
    bucketName: string,
    filePath: string, // This should be the path within the bucket (e.g., 'folder/filename.jpg'), NOT the public URL
    supabase: SupabaseClient
): Promise<{ success: boolean; error: Error | null }> {
    console.log(`[SupabaseDataManager] deleteFile: Attempting to delete from bucket "${bucketName}" at path "${filePath}"`);
    
    // Defensive check: if a full URL is mistakenly passed, try to extract the path
    let pathToDelete = filePath;
    if (filePath.startsWith(`https://`)) {
        try {
            const url = new URL(filePath);
            const pathSegments = url.pathname.split('/');
            // Expected format: /storage/v1/object/public/BUCKET_NAME/PATH_IN_BUCKET
            // We need to extract PATH_IN_BUCKET
            const bucketIndex = pathSegments.indexOf(bucketName);
            if (bucketIndex > -1 && pathSegments.length > bucketIndex + 1) {
                pathToDelete = pathSegments.slice(bucketIndex + 1).join('/');
            } else {
                 console.warn(`[SupabaseDataManager] deleteFile: Could not reliably extract path from URL: ${filePath}. Using original filePath.`);
            }
        } catch (urlError) {
            console.warn(`[SupabaseDataManager] deleteFile: Invalid URL format for deletion: ${filePath}. Using original filePath.`);
        }
    }


    try {
        const { error } = await supabase.storage
            .from(bucketName)
            .remove([pathToDelete]);

        if (error) {
            // Check for specific error code if file already doesn't exist (404 for storage items)
            if (error.statusCode === '404' || error.message.includes('Object not found') || error.message.includes('The resource was not found')) {
                console.warn(`[SupabaseDataManager] deleteFile: File not found during deletion for bucket "${bucketName}" path "${pathToDelete}", likely already removed. Returning success.`);
                return { success: true, error: null };
            }
            console.error(`[SupabaseDataManager] deleteFile Error for bucket "${bucketName}" path "${pathToDelete}":`, error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            return { success: false, error: error };
        }
        console.log(`[SupabaseDataManager] deleteFile Success for bucket "${bucketName}" path "${pathToDelete}"`);
        return { success: true, error: null };
    } catch (e: any) {
        console.error(`[SupabaseDataManager] deleteFile Caught Exception for bucket "${bucketName}" path "${pathToDelete}":`, e);
        return { success: false, error: e };
    }
};

/**
 * Fetches all entries from a Supabase table.
 */
export async function fetchAllEntries<T extends BaseContentItem>(tableName: string, supabase: SupabaseClient): Promise<T[] | null> {
    console.log(`[SupabaseDataManager] fetchAllEntries: Attempting to fetch from table "${tableName}"`);
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*'); // Removed default ordering here, let components specify if needed

        if (error) {
            console.error(`[SupabaseDataManager] fetchAllEntries Error for table "${tableName}":`, error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            return null;
        }
        console.log(`[SupabaseDataManager] fetchAllEntries Success for table "${tableName}". Count: ${data ? data.length : 0}. Data:`, data);
        return data as T[];
    } catch (e: any) {
        console.error(`[SupabaseDataManager] fetchAllEntries Caught Exception for table "${tableName}":`, e);
        return null;
    }
}

/**
 * Adds a new entry to a Supabase table.
 */
export async function addEntry<T extends BaseContentItem>(tableName: string, entryData: Omit<T, 'id' | 'created_at'>, supabase: SupabaseClient): Promise<T | null> {
    console.log(`[SupabaseDataManager] addEntry: Attempting to add to table "${tableName}" with data:`, entryData);
    try {
        const { data, error } = await supabase
            .from(tableName)
            .insert([entryData])
            .select() // Request the inserted data back
            .single(); // Expect a single row back

        if (error) {
            console.error(`[SupabaseDataManager] addEntry Error to table "${tableName}":`, error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            return null;
        }
        console.log(`[SupabaseDataManager] addEntry Success to table "${tableName}". Inserted data:`, data);
        return data as T;
    } catch (e: any) {
        console.error(`[SupabaseDataManager] addEntry Caught Exception for table "${tableName}":`, e);
        return null;
    }
}

/**
 * Updates an existing entry in a Supabase table.
 */
export async function updateEntry<T extends BaseContentItem>(tableName: string, id: string, updatedData: Partial<T>, supabase: SupabaseClient): Promise<T | null> {
    console.log(`[SupabaseDataManager] updateEntry: Attempting to update table "${tableName}" ID "${id}" with data:`, updatedData);
    try {
        const { data, error } = await supabase
            .from(tableName)
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[SupabaseDataManager] updateEntry Error for table "${tableName}" ID "${id}":`, error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            return null;
        }
        console.log(`[SupabaseDataManager] updateEntry Success for table "${tableName}" ID "${id}". Updated data:`, data);
        return data as T;
    } catch (e: any) {
        console.error(`[SupabaseDataManager] updateEntry Caught Exception for table "${tableName}" ID "${id}":`, e);
        return null;
    }
};

/**
 * Deletes an entry from a Supabase table.
 */
export async function deleteEntry(tableName: string, id: string, supabase: SupabaseClient): Promise<{ success: boolean; error: Error | null }> {
    console.log(`[SupabaseDataManager] deleteEntry: Attempting to delete from table "${tableName}" ID "${id}"`);
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[SupabaseDataManager] deleteEntry Error for table "${tableName}" ID "${id}":`, error);
            if (error.details) console.error("Error Details:", error.details);
            if (error.hint) console.error("Error Hint:", error.hint);
            return { success: false, error: error };
        }
        console.log(`[SupabaseDataManager] deleteEntry Success for table "${tableName}" ID "${id}".`);
        return { success: true, error: null };
    } catch (e: any) {
        console.error(`[SupabaseDataManager] deleteEntry Caught Exception for table "${tableName}" ID "${id}":`, e);
        return { success: false, error: e };
    }
};
