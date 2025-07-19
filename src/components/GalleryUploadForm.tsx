// ✅ GalleryUploadForm.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const GalleryUploadForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: '', description: '', image: null as File | null });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setForm((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) return toast({ title: 'Upload image required', variant: 'destructive' });

    const body = new FormData();
    body.append('imageFile', form.image);
    body.append('githubPath', 'public/gallery');
    body.append('jsonPath', 'src/data/gallery.json');
    body.append('metadata', JSON.stringify({ title: form.title, description: form.description }));

    const res = await fetch('/api/upload-content', { method: 'POST', body });

    if (res.ok) {
      toast({ title: 'Gallery item uploaded!' });
      setForm({ title: '', description: '', image: null });
    } else {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl">
      <h2 className="text-xl font-semibold">Upload Gallery Item</h2>
      <Input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <Textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
      <Input type="file" accept="image/*" onChange={handleFileChange} required />
      <Button type="submit">Upload</Button>
    </form>
  );
};

export default GalleryUploadForm;
