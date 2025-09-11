import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../utils/toast';

export function OrganizerOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [orgName, setOrgName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUser({
        name: orgName || user.name,
        email: contactEmail || user.email,
        isOnboarded: true,
        updatedAt: new Date().toISOString(),
      });
      showToast.success('Organizer profile set up successfully!');
      navigate('/organizer-dashboard');
    } catch (e) {
      showToast.error('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Organizer Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="mb-2 block">Organization Name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Your organization name" />
            </div>
            <div>
              <Label className="mb-2 block">Contact Email</Label>
              <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact email" />
            </div>
            <Button onClick={handleSubmit} disabled={isSubmitting || !orgName || !contactEmail} className="w-full">
              {isSubmitting ? 'Saving...' : 'Finish Setup'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}


