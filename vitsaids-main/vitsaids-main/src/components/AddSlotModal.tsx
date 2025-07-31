import React, { useState, useEffect } from 'react'; // Added useEffect for initial form data sync
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, BookOpen, User, Home } from 'lucide-react'; // Added User and Home for faculty/room icons

interface AddSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slotData: { // Updated onSave interface to include faculty and room
    year: string;
    day: string;
    startTime: string;
    endTime: string;
    subject: string;
    faculty: string; // Added faculty
    room: string; // Added room
  }) => Promise<void>; // Changed return type to Promise<void> as onSave is async
  selectedDay?: string;
  selectedYear?: string;
}

const AddSlotModal = ({ isOpen, onClose, onSave, selectedDay, selectedYear }: AddSlotModalProps) => {
  const [formData, setFormData] = useState({
    year: selectedYear || '1',
    day: selectedDay || 'Monday',
    startTime: '',
    endTime: '',
    subject: '',
    faculty: '', // Added to state
    room: '' // Added to state
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const years = ['1', '2', '3', '4'];

  // Effect to update form data when selectedDay or selectedYear props change
  // This ensures the modal opens with the correct pre-selected values from the TimetableManager
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      year: selectedYear || '1', // Default to '1' if selectedYear is undefined
      day: selectedDay || 'Monday' // Default to 'Monday' if selectedDay is undefined
    }));
  }, [selectedDay, selectedYear]);

  const handleSubmit = async (e: React.FormEvent) => { // Made handleSubmit async
    e.preventDefault();
    
    if (!formData.startTime || !formData.endTime || !formData.subject) {
      // You might want to show a toast message here for missing required fields
      return;
    }

    // Pass all required fields to onSave
    await onSave(formData); // Await the async onSave call
    
    // Reset form
    setFormData({
      year: selectedYear || '1', // Reset to current selected props
      day: selectedDay || 'Monday', // Reset to current selected props
      startTime: '',
      endTime: '',
      subject: '',
      faculty: '', // Reset faculty
      room: '' // Reset room
    });
    
    onClose();
  };

  const handleClose = () => {
    setFormData({
      year: selectedYear || '1',
      day: selectedDay || 'Monday',
      startTime: '',
      endTime: '',
      subject: '',
      faculty: '',
      room: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2 dark:text-gray-100">
            <Calendar className="w-5 h-5" />
            Add New Time Slot
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year" className="dark:text-gray-200">Year</Label>
              <Select value={formData.year} onValueChange={(value) => setFormData({...formData, year: value})}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {years.map(year => (
                    <SelectItem key={year} value={year} className="dark:text-gray-100 dark:hover:bg-gray-600">Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="day" className="dark:text-gray-200">Day</Label>
              <Select value={formData.day} onValueChange={(value) => setFormData({...formData, day: value})}>
                <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                  <SelectValue placeholder="Select Day" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {days.map(day => (
                    <SelectItem key={day} value={day} className="dark:text-gray-100 dark:hover:bg-gray-600">{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="flex items-center gap-2 dark:text-gray-200">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
            
            <div>
              <Label htmlFor="endTime" className="flex items-center gap-2 dark:text-gray-200">
                <Clock className="w-4 h-4" />
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                required
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subject" className="flex items-center gap-2 dark:text-gray-200">
              <BookOpen className="w-4 h-4" />
              Subject Name
            </Label>
            <Input
              id="subject"
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              placeholder="Enter subject name"
              required
              className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            />
          </div>

            {/* Added Faculty and Room inputs */}
            <div>
              <Label htmlFor="faculty" className="flex items-center gap-2 dark:text-gray-200">
                <User className="w-4 h-4" />
                Faculty (Optional)
              </Label>
              <Input
                id="faculty"
                type="text"
                value={formData.faculty}
                onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                placeholder="Enter faculty name"
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

            <div>
              <Label htmlFor="room" className="flex items-center gap-2 dark:text-gray-200">
                <Home className="w-4 h-4" />
                Room (Optional)
              </Label>
              <Input
                id="room"
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: e.target.value})}
                placeholder="Enter room number"
                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
              />
            </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" className="flex-1 dark:bg-blue-600 dark:hover:bg-blue-700">
              Add Slot
            </Button>
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSlotModal;
