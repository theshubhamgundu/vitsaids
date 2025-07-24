import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseOld } from '@/integrations/supabase/supabaseOld';
import AddSlotModal from './AddSlotModal';

const TimetableManager = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState('1');
  const [editingSlot, setEditingSlot] = useState(null);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timetableData, setTimetableData] = useState({});

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Load timetable data from database
  const loadTimetableData = async () => {
    try {
      const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .order('hour');
      
      if (!error && data) {
        // Transform data into the expected format
        const transformedData = {};
        data.forEach(slot => {
          if (!transformedData[slot.year]) {
            transformedData[slot.year] = {};
          }
          if (!transformedData[slot.year][slot.day]) {
            transformedData[slot.year][slot.day] = {};
          }
          transformedData[slot.year][slot.day][slot.hour] = slot.subject_name;
        });
        setTimetableData(transformedData);
      }
    } catch (error) {
      console.error('Error loading timetable:', error);
    }
  };

  useEffect(() => {
    loadTimetableData();
  }, []);

  const updateTimetableSlot = async (year, day, timeSlot, subject) => {
    try {
      // Check if slot exists
      const { data: existing } = await supabase
        .from('timetable')
        .select('id')
        .eq('year', parseInt(year))
        .eq('day', day)
        .eq('hour', timeSlot);

      if (existing && existing.length > 0) {
        // Update existing slot
        const { error } = await supabase
          .from('timetable')
          .update({ subject_name: subject })
          .eq('id', existing[0].id);
        
        if (error) throw error;
      } else {
        // Insert new slot
        const { error } = await supabase
          .from('timetable')
          .insert({
            year: parseInt(year),
            day: day,
            hour: timeSlot,
            subject_name: subject
          });
        
        if (error) throw error;
      }

      // Update local state
      setTimetableData(prev => ({
        ...prev,
        [year]: {
          ...prev[year],
          [day]: {
            ...prev[year]?.[day],
            [timeSlot]: subject
          }
        }
      }));
      
      toast({ title: "Timetable updated successfully" });
    } catch (error) {
      console.error('Error updating timetable:', error);
      toast({ title: "Error updating timetable", variant: "destructive" });
    }
  };

  const deleteSlot = async (year, day, timeSlot) => {
    try {
      const { error } = await supabase
        .from('timetable')
        .delete()
        .eq('year', parseInt(year))
        .eq('day', day)
        .eq('hour', timeSlot);
      
      if (error) throw error;

      // Update local state
      setTimetableData(prev => {
        const newData = { ...prev };
        if (newData[year]?.[day]) {
          delete newData[year][day][timeSlot];
        }
        return newData;
      });
      
      toast({ title: "Time slot deleted successfully" });
    } catch (error) {
      console.error('Error deleting slot:', error);
      toast({ title: "Error deleting slot", variant: "destructive" });
    }
  };

  const handleAddSlot = async (slotData) => {
    const { year, day, startTime, endTime, subject } = slotData;
    
    // Convert 24-hour format to 12-hour format for display
    const formatTime = (time) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    const formattedTimeSlot = `${formatTime(startTime)}-${formatTime(endTime)}`;
    
    try {
      const { error } = await supabase
        .from('timetable')
        .insert({
          year: parseInt(year),
          day: day,
          hour: formattedTimeSlot,
          subject_name: subject
        });
      
      if (error) throw error;

      // Update local state
      setTimetableData(prev => ({
        ...prev,
        [year]: {
          ...prev[year],
          [day]: {
            ...prev[year]?.[day],
            [formattedTimeSlot]: subject
          }
        }
      }));
      
      toast({ 
        title: "New time slot added successfully",
        description: `${subject} added to ${day} at ${formattedTimeSlot}`
      });
    } catch (error) {
      console.error('Error adding slot:', error);
      toast({ title: "Error adding slot", variant: "destructive" });
    }
  };

  const SlotEditModal = ({ slot, onSave, onClose }) => {
    const [subject, setSubject] = useState(slot?.subject || '');

    const handleSave = () => {
      if (slot) {
        updateTimetableSlot(slot.year, slot.day, slot.timeSlot, subject);
      }
      onClose();
    };

    return (
      <Dialog open={!!slot} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit {slot?.day} - {slot?.timeSlot}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject name"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>Save</Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  // Get all unique time slots for the selected year and day
  const getTimeSlotsForDay = (year, day) => {
    return Object.keys(timetableData[year]?.[day] || {}).sort();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timetable Management</h2>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Year 1</SelectItem>
              <SelectItem value="2">Year 2</SelectItem>
              <SelectItem value="3">Year 3</SelectItem>
              <SelectItem value="4">Year 4</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => setShowAddSlot(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Slot
          </Button>
        </div>
      </div>

      <Tabs defaultValue="Monday" className="w-full" onValueChange={setSelectedDay}>
        <TabsList className="grid w-full grid-cols-6">
          {days.map(day => (
            <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
          ))}
        </TabsList>

        {days.map(day => (
          <TabsContent key={day} value={day}>
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{day} - Year {selectedYear}</span>
                  <Button 
                    size="sm"
                    onClick={() => setShowAddSlot(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to {day}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {getTimeSlotsForDay(selectedYear, day).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No time slots scheduled for this day.</p>
                      <p>Click "Add to {day}" to create your first time slot.</p>
                    </div>
                  ) : (
                    getTimeSlotsForDay(selectedYear, day).map(timeSlot => {
                      const subject = timetableData[selectedYear]?.[day]?.[timeSlot];
                      return (
                        <div key={timeSlot} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium text-sm">{timeSlot}</span>
                            <span className="ml-4 text-gray-700">{subject}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingSlot({
                                year: selectedYear,
                                day,
                                timeSlot,
                                subject
                              })}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteSlot(selectedYear, day, timeSlot)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <SlotEditModal
        slot={editingSlot}
        onSave={updateTimetableSlot}
        onClose={() => setEditingSlot(null)}
      />

      <AddSlotModal
        isOpen={showAddSlot}
        onClose={() => setShowAddSlot(false)}
        onSave={handleAddSlot}
        selectedDay={selectedDay}
        selectedYear={selectedYear}
      />
    </div>
  );
};

export default TimetableManager;
