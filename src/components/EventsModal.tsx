// src/components/EventsModal.tsx

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EventsModalProps {
  open: boolean;
  onClose: () => void;
}

interface EventData {
  title: string;
  description: string;
  image: string;
  createdAt: string;
}

const EventsModal: React.FC<EventsModalProps> = ({ open, onClose }) => {
  const [events, setEvents] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch('/src/data/events.json'); // update path if hosted
      const data = await res.json();
      setEvents(data);
    };

    if (open) fetchEvents();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recent Events</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {events.map((item, idx) => (
            <div key={idx} className="border p-3 rounded-lg shadow-sm">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-40 object-cover rounded"
              />
              <h3 className="mt-2 font-semibold">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventsModal;
