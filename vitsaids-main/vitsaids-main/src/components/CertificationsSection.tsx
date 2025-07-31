import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseOld as supabase } from '@/integrations/supabase/supabaseOld';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import UploadCertificationModal from './UploadCertificationModal';

interface Certificate {
  id: string;
  htno: string;
  title: string;
  description: string;
  file_url: string;
  uploaded_at: string;
}

const CertificationsSection = () => {
  const { userProfile } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const { toast } = useToast();

  const fetchCertificates = async () => {
    if (!userProfile?.ht_no) return;
    const { data, error } = await supabase
      .from('student_certificates')
      .select('*')
      .eq('htno', userProfile.ht_no)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching certificates:', error);
    } else {
      setCertificates(data);
    }
  };

  useEffect(() => {
    fetchCertificates();

    const certChannel = supabase
      .channel('student_certificates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_certificates',
        },
        () => {
          fetchCertificates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(certChannel);
    };
  }, [userProfile?.ht_no]);

  const handleDelete = async (certificateId: string) => {
    const { error } = await supabase
      .from('student_certificates')
      .delete()
      .eq('id', certificateId);

    if (error) {
      console.error('Error deleting certificate:', error);
      toast({ title: 'Failed to delete certificate', variant: 'destructive' });
    } else {
      toast({ title: 'Certificate deleted successfully' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>My Certifications</span>
        </CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Upload Certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Certification</DialogTitle>
            </DialogHeader>
            <UploadCertificationModal onUpload={fetchCertificates} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {certificates.length > 0 ? (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="border rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <h3 className="text-lg font-semibold">{cert.title}</h3>
                  <p className="text-sm text-gray-600">{cert.description}</p>
                  <a
                    href={cert.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm mt-2 inline-block"
                  >
                    View / Download Certificate
                  </a>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(cert.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No certificates uploaded yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificationsSection;
