// src/components/FacultyModal.tsx

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FacultyModalProps {
  open: boolean;
  onClose: () => void;
}

interface Faculty {
  name: string;
  designation: string;
  image: string;
  // add more if needed
}

const FacultyModal: React.FC<FacultyModalProps> = ({ open, onClose }) => {
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);

  useEffect(() => {
    const fetchFaculty = async () => {
      const res = await fetch('/src/data/faculty.json'); // or hosted raw GitHub file
      const data = await res.json();
      setFacultyList(data);
    };

    if (open) fetchFaculty();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto w-full max-w-3xl">
        <DialogHeader>
          <DialogTitle>Our Faculty</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {facultyList.map((faculty, idx) => (
            <div key={idx} className="border p-3 rounded-lg shadow-sm">
              <img
                src={faculty.image}
                alt={faculty.name}
                className="w-full h-40 object-cover rounded"
              />
              <h3 className="mt-2 font-semibold">{faculty.name}</h3>
              <p className="text-sm text-gray-600">{faculty.designation}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FacultyModal;
