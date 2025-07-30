import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabaseOld as supabase } from '@/integrations/supabase/supabaseOld';
import { Upload } from 'lucide-react';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  userProfile: any;
  onComplete: () => void;
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  userProfile,
  onComplete
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    emergency_no: userProfile?.emergency_no || ''
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.phone || !formData.address || !formData.emergency_no) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      toast({
        title: 'Invalid Phone',
        description: 'Phone number must be 10 digits.',
        variant: 'destructive'
      });
      return;
    }

    if (!/^\d{10}$/.test(formData.emergency_no)) {
      toast({
        title: 'Invalid Emergency Contact',
        description: 'Emergency number must be 10 digits.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      let photoUrl = userProfile?.photo_url;

      // Upload profile photo
      if (photoFile) {
        const { error: uploadError } = await supabase.storage
          .from('profile_photos')
          .upload(`profiles/${userProfile.id}/photo.jpg`, photoFile, {
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('profile_photos')
          .getPublicUrl(`profiles/${userProfile.id}/photo.jpg`);

        photoUrl = urlData?.publicUrl;
        if (fileInputRef.current) fileInputRef.current.value = '';
      }

      // Update user profile
      const { error } = await supabase
        .from('user_profiles')
        .update({
          phone: formData.phone,
          address: formData.address,
          emergency_no: formData.emergency_no,
          photo_url: photoUrl
        })
        .eq('id', userProfile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Profile completed successfully!'
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete profile.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please complete your profile information to continue using the dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={e => handleInputChange('address', e.target.value)}
              placeholder="Enter your address"
            />
          </div>

          <div>
            <Label htmlFor="emergency_no">Emergency Contact (Parent Number) *</Label>
            <Input
              id="emergency_no"
              type="tel"
              value={formData.emergency_no}
              onChange={e => handleInputChange('emergency_no', e.target.value)}
              placeholder="Enter parent/emergency contact number"
            />
          </div>

          <div>
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {photoFile ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {photoFile && (
                <span className="text-sm text-muted-foreground">{photoFile.name}</span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;
