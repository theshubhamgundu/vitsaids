import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationHeader } from '../NavigationHeader';

export function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader title="Profile" />

      <div className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Profile Page</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Profile management interface would be implemented here.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}