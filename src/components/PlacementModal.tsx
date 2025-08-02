import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Placement {
  id?: string;
  student_name?: string;
  company: string;
  position: string;
  package: string;
  ctc?: number;
  year: string;
  type: string;
  branch?: string;
  students_placed?: number;
  created_at?: string;
}

interface PlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  placement?: Placement | null;
}

const PlacementModal = ({ isOpen, onClose, onSave, placement }: PlacementModalProps) => {
  const [formData, setFormData] = useState<Placement>({
    student_name: '',
    company: '',
    position: '',
    package: '',
    ctc: 0,
    year: '',
    type: 'full-time',
    branch: 'AI&DS',
    students_placed: 1
  });
  const { toast } = useToast();

  useEffect(() => {
    if (placement) {
      setFormData(placement);
    } else {
      setFormData({
        student_name: '',
        company: '',
        position: '',
        package: '',
        ctc: 0,
        year: '',
        type: 'full-time',
        branch: 'AI&DS',
        students_placed: 1
      });
    }
  }, [placement]);

  const handleSave = async () => {
    try {
      if (placement?.id) {
        // Update existing placement
        const { error } = await supabase
          .from('placements')
          .update(formData)
          .eq('id', placement.id);

        if (error) throw error;
        toast({ title: 'Placement record updated successfully' });
      } else {
        // Create new placement
        const { error } = await supabase
          .from('placements')
          .insert(formData);

        if (error) throw error;
        toast({ title: 'Placement record created successfully' });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving placement:', error);
      toast({ title: 'Error saving placement record', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{placement ? 'Edit Placement Record' : 'Add New Placement Record'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student Name</label>
            <Input
              value={formData.student_name}
              onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
              placeholder="Student name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            <Input
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Position *</label>
            <Input
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="Job position"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Package *</label>
              <Input
                value={formData.package}
                onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                placeholder="e.g., 12 LPA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CTC (in LPA)</label>
              <Input
                type="number"
                value={formData.ctc || ''}
                onChange={(e) => setFormData({ ...formData, ctc: Number(e.target.value) })}
                placeholder="12"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Year *</label>
              <Input
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2024"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Branch</label>
              <Input
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                placeholder="AI&DS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Students Placed</label>
              <Input
                type="number"
                value={formData.students_placed || 1}
                onChange={(e) => setFormData({ ...formData, students_placed: Number(e.target.value) })}
                placeholder="1"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              {placement ? 'Update' : 'Create'}
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

export default PlacementModal;