import React, { useState } from 'react';
import { uploadImageAndAppendData } from '@/lib/githubUploader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const FacultyUploadForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: '',
    designation: '',
    qualification: '',
    contact: '',
    email: '',
    research: '',
    image: null as File | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setForm((prev) => ({ ...prev, image: e.target.files![0] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) return toast({ title: 'Upload image required' });

    const metadata = {
      name: form.name,
      designation: form.designation,
      qualification: form.qualification,
      contact: form.contact,
      email: form.email,
      research: form.research,
    };

    const success = await uploadImageAndAppendData({
      imageFile: form.image,
      githubPath: 'public/faculty',
      jsonPath: 'src/data/faculty.json',
      metadata,
    });

    if (success) {
      toast({ title: 'Faculty uploaded successfully!' });
      setForm({ name: '', designation: '', qualification: '', contact: '', email: '', research: '', image: null });
    } else {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl">
      <h2 className="text-xl font-semibold">Upload Faculty</h2>
      <Input name="name" placeholder="Faculty Name" value={form.name} onChange={handleChange} required />
      <Input name="designation" placeholder="Designation" value={form.designation} onChange={handleChange} required />
      <Input name="qualification" placeholder="Qualification" value={form.qualification} onChange={handleChange} required />
      <Input name="contact" placeholder="Contact No" value={form.contact} onChange={handleChange} required />
      <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <Textarea name="research" placeholder="Research Details" value={form.research} onChange={handleChange} required />
      <Input type="file" accept="image/*" onChange={handleFileChange} required />
      <Button type="submit">Upload Faculty</Button>
    </form>
  );
};

export default FacultyUploadForm;
