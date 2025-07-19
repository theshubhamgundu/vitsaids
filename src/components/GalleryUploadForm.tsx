import React, { useState } from 'react';
import { toast } from 'sonner';

const GalleryUploadForm = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!title || !description || !imageFile) {
      toast.error('All fields are required.');
      return;
    }

    const formData = new FormData();
    formData.append('type', 'gallery');
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', imageFile);

    setIsUploading(true);

    try {
      const res = await fetch('/api/upload-content', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      toast.success('Gallery item uploaded!');
      setTitle('');
      setDescription('');
      setImageFile(null);
    } catch (err) {
      console.error(err);
      toast.error('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl shadow w-full max-w-xl space-y-4">
      <h2 className="text-xl font-semibold">Upload Gallery Item</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        disabled={isUploading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default GalleryUploadForm;
