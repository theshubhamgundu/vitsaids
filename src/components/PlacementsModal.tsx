// src/components/PlacementsModal.tsx

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PlacementsModalProps {
  open: boolean;
  onClose: () => void;
}

interface PlacementItem {
  title: string;
  description: string;
  image: string;
  createdAt: string;
}

const PlacementsModal: React.FC<PlacementsModalProps> = ({ open, onClose }) => {
  const [placements, setPlacements] = useState<PlacementItem[]>([]);

  useEffect(() => {
    const fetchPlacements = async () => {
      const res = await fetch('/src/data/placements.json'); // update path if hosted elsewhere
      const data = await res.json();
      setPlacements(data);
    };

    if (open) fetchPlacements();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Placement Highlights</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {placements.map((item, idx) => (
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

export default PlacementsModal;
