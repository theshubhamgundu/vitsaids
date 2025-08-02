import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  venue?: string;
  speaker?: string;
  image_url?: string;
  created_at?: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  event?: Event | null;
}

const EventModal = ({ isOpen, onClose, onSave, event }: EventModalProps) => {
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    speaker: '',
    image_url: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        speaker: '',
        image_url: ''
      });
    }
  }, [event]);

  const handleSave = async () => {
    try {
      if (event?.id) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(formData)
          .eq('id', event.id);

        if (error) throw error;
        toast({ title: 'Event updated successfully' });
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert(formData);

        if (error) throw error;
        toast({ title: 'Event created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({ title: 'Error saving event', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add New Event'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Event title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Event description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time *</label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Venue</label>
            <Input
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="Event venue"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Speaker</label>
            <Input
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
              placeholder="Speaker name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image URL</label>
            <Input
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="Event image URL"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {event ? 'Update' : 'Create'}
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

export default EventModal;