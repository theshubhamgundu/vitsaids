import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id?: string;
  title: string;
  student_name: string;
  description?: string;
  image_url?: string;
  created_at?: string;
}

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  achievement?: Achievement | null;
}

const AchievementModal = ({ isOpen, onClose, onSave, achievement }: AchievementModalProps) => {
  const [formData, setFormData] = useState<Achievement>({
    title: '',
    student_name: '',
    description: '',
    image_url: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (achievement) {
      setFormData(achievement);
    } else {
      setFormData({
        title: '',
        student_name: '',
        description: '',
        image_url: ''
      });
    }
  }, [achievement]);

  const handleSave = async () => {
    try {
      if (achievement?.id) {
        // Update existing achievement
        const { error } = await (supabase as any)
          .from('achievements')
          .update(formData)
          .eq('id', achievement.id);

        if (error) throw error;
        toast({ title: 'Achievement updated successfully' });
      } else {
        // Create new achievement
        const { error } = await (supabase as any)
          .from('achievements')
          .insert(formData);

        if (error) throw error;
        toast({ title: 'Achievement created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast({ title: 'Error saving achievement', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{achievement ? 'Edit Achievement' : 'Add New Achievement'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Achievement title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Student Name *</label>
            <Input
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              placeholder="Student name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Achievement description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="Achievement image URL"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {achievement ? 'Update' : 'Create'}
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

export default AchievementModal;