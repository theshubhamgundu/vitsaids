import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const EventsUploadForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
    image: null as File | null,
  });

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

    if (!form.image) {
      toast({ title: 'Image is required', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('imageFile', form.image);
    formData.append('githubPath', 'public/events'); // Image upload directory
    formData.append('jsonPath', 'src/data/events.json'); // JSON metadata path

    const metadata = {
      title: form.title,
      date: form.date,
      location: form.location,
      description: form.description,
    };
    formData.append('metadata', JSON.stringify(metadata));

    try {
      const res = await fetch('/api/upload-content', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        toast({ title: 'Event uploaded successfully!' });
        setForm({ title: '', date: '', location: '', description: '', image: null });
      } else {
        const error = await res.json();
        toast({ title: error.message || 'Upload failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Something went wrong!', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl">
      <h2 className="text-xl font-semibold">Upload Event</h2>
      <Input name="title" placeholder="Event Title" value={form.title} onChange={handleChange} required />
      <Input name="date" type="date" value={form.date} onChange={handleChange} required />
      <Input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />
      <Textarea name="description" placeholder="Event Description" value={form.description} onChange={handleChange} required />
      <Input type="file" accept="image/*" onChange={handleFileChange} required />
      <Button type="submit">Upload Event</Button>
    </form>
  );
};

export default EventsUploadForm;
