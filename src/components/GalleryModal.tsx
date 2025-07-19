// src/components/GalleryModal.tsx

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GalleryModalProps {
  open: boolean;
  onClose: () => void;
}

interface GalleryItem {
  title: string;
  description: string;
  image: string;
  createdAt: string;
}

const GalleryModal: React.FC<GalleryModalProps> = ({ open, onClose }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const fetchGallery = async () => {
      const res = await fetch('/src/data/gallery.json'); // update if hosting from public
      const data = await res.json();
      setItems(data);
    };

    if (open) fetchGallery();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gallery</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {items.map((item, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden shadow-sm">
              <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
              <div className="p-2">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GalleryModal;
