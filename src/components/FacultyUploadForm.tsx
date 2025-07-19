import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const FacultyUploadForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', title: '', bio: '', image: null as File | null });

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
    body.append('githubPath', 'public/faculty');
    body.append('jsonPath', 'src/data/faculty.json');
    body.append('metadata', JSON.stringify({ name: form.name, title: form.title, bio: form.bio }));

    const res = await fetch('/api/upload-content', { method: 'POST', body });

    if (res.ok) {
      toast({ title: 'Faculty uploaded!' });
      setForm({ name: '', title: '', bio: '', image: null });
    } else {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl">
      <h2 className="text-xl font-semibold">Upload Faculty</h2>
      <Input name="name" placeholder="Faculty Name" value={form.name} onChange={handleChange} required />
      <Input name="title" placeholder="Designation" value={form.title} onChange={handleChange} required />
      <Textarea name="bio" placeholder="Short Bio" value={form.bio} onChange={handleChange} required />
      <Input type="file" accept="image/*" onChange={handleFileChange} required />
      <Button type="submit">Upload Faculty</Button>
    </form>
  );
};

export default FacultyUploadForm;
