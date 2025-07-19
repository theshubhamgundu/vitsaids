import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

type Achievement = {
  title: string;
  description: string;
  date: string;
  certificateUrl?: string;
};

const AchievementsModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (open) {
      fetch(
        'https://raw.githubusercontent.com/theshubhamgundu/vitsaids/main/src/data/achievements.json'
      )
        .then((res) => res.json())
        .then((data) => setAchievements(data))
        .catch((err) => console.error('Failed to load achievements', err));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Student Achievements</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <ul className="space-y-4 mt-4">
            {achievements.length === 0 && (
              <p className="text-gray-500 text-center">No achievements yet.</p>
            )}
            {achievements.map((item, idx) => (
              <li key={idx} className="bg-gray-100 p-4 rounded shadow">
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(item.date).toLocaleDateString()}
                </p>
                {item.certificateUrl && (
                  <a
                    href={item.certificateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 text-sm underline mt-2 inline-block"
                  >
                    View Certificate
                  </a>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AchievementsModal;
