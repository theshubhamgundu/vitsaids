import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Faculty {
  id?: string;
  name: string;
  position: string;
  expertise?: string;
  email?: string;
  phone?: string;
  image_url?: string;
  bio?: string;
  education?: string;
  research?: string;
  linkedin?: string;
  publications?: string;
  created_at?: string;
}

interface FacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  faculty?: Faculty | null;
}

const FacultyModal = ({ isOpen, onClose, onSave, faculty }: FacultyModalProps) => {
  const [formData, setFormData] = useState<Faculty>({
    name: '',
    position: '',
    expertise: '',
    email: '',
    phone: '',
    image_url: '',
    bio: '',
    education: '',
    research: '',
    linkedin: '',
    publications: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (faculty) {
      setFormData(faculty);
    } else {
      setFormData({
        name: '',
        position: '',
        expertise: '',
        email: '',
        phone: '',
        image_url: '',
        bio: '',
        education: '',
        research: '',
        linkedin: '',
        publications: ''
      });
    }
  }, [faculty]);

  const handleSave = async () => {
    try {
      if (faculty?.id) {
        // Update existing faculty
        const { error } = await supabase
          .from('faculty')
          .update(formData)
          .eq('id', faculty.id);

        if (error) throw error;
        toast({ title: 'Faculty member updated successfully' });
      } else {
        // Create new faculty
        const { error } = await supabase
          .from('faculty')
          .insert(formData);

        if (error) throw error;
        toast({ title: 'Faculty member created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving faculty:', error);
      toast({ title: 'Error saving faculty member', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{faculty ? 'Edit Faculty Member' : 'Add New Faculty Member'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Faculty name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position *</label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g., Professor, Associate Professor"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expertise</label>
            <Input
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              placeholder="Areas of expertise"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="Profile image URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief biography"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Education</label>
            <Textarea
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              placeholder="Educational background"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Research</label>
            <Textarea
              value={formData.research}
              onChange={(e) => setFormData({ ...formData, research: e.target.value })}
              placeholder="Research interests and projects"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">LinkedIn</label>
              <Input
                value={formData.linkedin}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                placeholder="LinkedIn profile URL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Publications</label>
              <Input
                value={formData.publications}
                onChange={(e) => setFormData({ ...formData, publications: e.target.value })}
                placeholder="Number of publications"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {faculty ? 'Update' : 'Create'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyModal;