import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Result {
  id: string;
  semester: string;
  cgpa: number;
  result_url: string;
  uploaded_at: string;
}

const ResultsSection = () => {
  const { userProfile } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.ht_no) {
      fetchResults(userProfile.ht_no);
    }
  }, [userProfile]);

  const fetchResults = async (htno: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_results')
      .select('*')
      .eq('htno', htno)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      setResults(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Fetching results...
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        No results uploaded by admin yet.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Your Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((result) => (
            <div key={result.id} className="border p-4 rounded-md shadow-sm">
              <p className="text-lg font-semibold mb-1">{result.semester}</p>
              <p className="text-sm text-gray-600 mb-2">CGPA: {result.cgpa}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(result.result_url, '_blank')}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>View / Download</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultsSection;
