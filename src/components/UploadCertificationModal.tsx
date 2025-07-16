import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UploadCloud, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const UploadCertificationModal = ({ onUpload }: { onUpload: () => void }) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file || !title) {
      toast({
        title: 'Validation Error',
        description: 'Both title and certificate file are required.',
        variant: 'destructive',
      });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const authUid = authData?.user?.id;

    if (!authUid || !userProfile?.id || authUid !== userProfile.id) {
      toast({
        title: 'Authentication mismatch',
        description: 'Please login again or contact admin.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const filename = `${Date.now()}_${file.name}`;
      const storagePath = `${userProfile.id}/${filename}`; // ✅ Must match storage RLS (user_id folder)

      const { error: fileError } = await supabase.storage
        .from('certifications')
        .upload(storagePath, file);

      if (fileError) {
        throw new Error(`Storage upload failed: ${fileError.message}`);
      }

      const { publicUrl } = supabase
        .storage
        .from('certifications')
        .getPublicUrl(storagePath).data;

      const { error: insertError } = await supabase
        .from('student_certificates')
        .insert({
          htno: userProfile.ht_no,
          title,
          description,
          file_url: publicUrl,
          user_id: userProfile.id, // ✅ Must match RLS
        });

      if (insertError) {
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      toast({
        title: '✅ Certificate uploaded successfully!',
      });

      // Reset
      setFile(null);
      setTitle('');
      setDescription('');
      onUpload();
    } catch (err: any) {
      console.error('[Upload Error]', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Something went wrong during upload.',
        variant: 'destructive',
      });
    }

    setUploading(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Upload Certificate</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5" />
            <span>Upload Certification</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Hackathon Winner"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details"
            />
          </div>
          <div>
            <Label>Upload PDF</Label>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Submit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadCertificationModal;
