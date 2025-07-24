import React, { useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const CONTENT_TYPES = ['gallery', 'events', 'faculty', 'placements', 'achievements'];

export default function ContentUploader() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [type, setType] = useState('gallery');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async () => {
    if (!title || !imageFile || !type) {
      toast.error('Please fill all required fields');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileBase64 = reader.result;

      try {
        setIsLoading(true);
        const res = await axios.post('/api/upload-content', {
          fileBase64,
          title,
          description,
          type,
        });

        toast.success(`${type} uploaded successfully`);
        setTitle('');
        setDescription('');
        setImageFile(null);
      } catch (err) {
        toast.error('Upload failed');
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsDataURL(imageFile);
  };

  return (
    <Card className="max-w-xl mx-auto mt-6">
      <CardContent className="space-y-4 p-6">
        <h2 className="text-xl font-semibold text-center">Upload Content</h2>

        <div>
          <Label>Content Type</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description (optional)"
          />
        </div>

        <div>
          <Label>Image</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button onClick={handleUpload} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload'}
        </Button>
      </CardContent>
    </Card>
  );
}
