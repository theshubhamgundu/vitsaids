import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GalleryItem {
  id?: string;
  title?: string;
  description?: string;
  url: string;
  type: string;
  uploaded_at?: string;
  created_at?: string;
}

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  galleryItem?: GalleryItem | null;
}

const GalleryModal = ({ isOpen, onClose, onSave, galleryItem }: GalleryModalProps) => {
  const [formData, setFormData] = useState<GalleryItem>({
    title: '',
    description: '',
    url: '',
    type: 'image'
  });
  const { toast } = useToast();

  useEffect(() => {
    if (galleryItem) {
      setFormData(galleryItem);
    } else {
      setFormData({
        title: '',
        description: '',
        url: '',
        type: 'image'
      });
    }
  }, [galleryItem]);

  const handleSave = async () => {
    try {
      const dataToSave = {
        ...formData,
        uploaded_at: galleryItem?.uploaded_at || new Date().toISOString()
      };

      if (galleryItem?.id) {
        // Update existing gallery item
        const { error } = await supabase
          .from('gallery')
          .update(dataToSave)
          .eq('id', galleryItem.id);

        if (error) throw error;
        toast({ title: 'Gallery item updated successfully' });
      } else {
        // Create new gallery item
        const { error } = await supabase
          .from('gallery')
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: 'Gallery item created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving gallery item:', error);
      toast({ title: 'Error saving gallery item', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{galleryItem ? 'Edit Gallery Item' : 'Add New Gallery Item'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Gallery item title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Gallery item description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL *</label>
            <Input
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="Image or video URL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {galleryItem ? 'Update' : 'Create'}
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

export default GalleryModal;