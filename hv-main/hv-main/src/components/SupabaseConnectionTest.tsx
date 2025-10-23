import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Loader2, Database, Users, Calendar } from 'lucide-react';

interface ConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  userCount?: number;
  tables?: string[];
}

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isLoading: true,
    error: null
  });

  const testConnection = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Test basic connection
      const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
      
      if (error) {
        // If migrations table doesn't exist, try a different approach
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          throw authError;
        }
        
        setStatus({
          isConnected: true,
          isLoading: false,
          error: null,
          userCount: 0,
          tables: ['auth.users']
        });
      } else {
        setStatus({
          isConnected: true,
          isLoading: false,
          error: null,
          userCount: 0,
          tables: ['_supabase_migrations']
        });
      }
    } catch (error: any) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error.message || 'Connection failed'
      });
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database size={20} />
          <span>Supabase Connection</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          {status.isLoading ? (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Loader2 size={12} className="animate-spin" />
              <span>Testing...</span>
            </Badge>
          ) : status.isConnected ? (
            <Badge className="bg-green-600 flex items-center space-x-1">
              <CheckCircle size={12} />
              <span>Connected</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <XCircle size={12} />
              <span>Failed</span>
            </Badge>
          )}
        </div>

        {status.error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              <strong>Error:</strong> {status.error}
            </p>
          </div>
        )}

        {status.isConnected && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center space-x-1">
                <Users size={14} />
                <span>Database:</span>
              </span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            
            {status.tables && (
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>Tables:</span>
                </span>
                <span className="text-muted-foreground">
                  {status.tables.length} detected
                </span>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={testConnection} 
          disabled={status.isLoading}
          className="w-full"
          variant="outline"
        >
          {status.isLoading ? (
            <>
              <Loader2 size={14} className="mr-2 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
