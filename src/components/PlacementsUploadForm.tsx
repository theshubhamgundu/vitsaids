import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PlacementsUploadForm = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ studentName: '', company: '', package: '', year: '', image: null as File | null });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    body.append('githubPath', 'public/placements');
    body.append('jsonPath', 'src/data/placements.json');
    body.append('metadata', JSON.stringify({ studentName: form.studentName, company: form.company, package: form.package, year: form.year }));

    const res = await fetch('/api/upload-content', { method: 'POST', body });

    if (res.ok) {
      toast({ title: 'Placement uploaded!' });
      setForm({ studentName: '', company: '', package: '', year: '', image: null });
    } else {
      toast({ title: 'Upload failed', variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-xl">
      <h2 className="text-xl font-semibold">Upload Placement</h2>
      <Input name="studentName" placeholder="Student Name" value={form.studentName} onChange={handleChange} required />
      <Input name="company" placeholder="Company" value={form.company} onChange={handleChange} required />
      <Input name="package" placeholder="Package (e.g. 8 LPA)" value={form.package} onChange={handleChange} required />
      <Input name="year" placeholder="Year (e.g. 2025)" value={form.year} onChange={handleChange} required />
      <Input type="file" accept="image/*" onChange={handleFileChange} required />
      <Button type="submit">Upload Placement</Button>
    </form>
  );
};

export default PlacementsUploadForm;
