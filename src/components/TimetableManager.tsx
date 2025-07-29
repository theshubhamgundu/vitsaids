import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SupabaseClient } from '@supabase/supabase-js'; // Import SupabaseClient type
// import { supabaseOld } from '@/integrations/supabase/supabaseOld'; // No longer directly imported here, but passed as prop
import AddSlotModal from './AddSlotModal'; // Assuming this component exists and its logic is compatible

// Define interface for TimetableSlot as expected by the DB and component
interface TimetableSlot {
    id: string;
    year: number; // Storing as number
    day: string;
    hour: string; // Storing formatted time slot like "9:00 AM-10:00 AM"
    subject_name: string; // Corrected column name
    created_at?: string;
}

// Props interface for TimetableManager
interface TimetableManagerProps {
    supabaseNew: SupabaseClient; // Keeping for completeness, even if not used directly by this component for its data
    supabaseOld: SupabaseClient; // This is the client used for timetable_slots
    toast: ReturnType<typeof useToast>['toast']; // Pass toast function explicitly
}

const TimetableManager: React.FC<TimetableManagerProps> = ({ supabaseNew, supabaseOld, toast }) => {
    const [selectedYear, setSelectedYear] = useState('1');
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null); // Type for editing slot
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [timetableData, setTimetableData] = useState<{ [year: string]: { [day: string]: { [hour: string]: string } } }>({});
    const [isLoading, setIsLoading] = useState(false); // Added loading state

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const years = ['1', '2', '3', '4']; // Assuming years 1-4

    // Load timetable data from database
    const loadTimetableData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use supabaseOld as confirmed for timetable
            const { data, error } = await supabaseOld
                .from('timetable_slots') // Changed table name to 'timetable_slots'
                .select('*')
                .eq('year', parseInt(selectedYear)) // Filter by selectedYear
                .order('hour'); // Order by hour

            if (error) {
                console.error('Error loading timetable data:', error);
                toast({ title: 'Error loading timetable', description: error.message || 'Please check Supabase "timetable_slots" table.', variant: 'destructive' });
                return;
            }

            // Transform data into the expected format
            // This logic groups by day and then hour for easy lookup in the UI
            const transformedData: { [year: string]: { [day: string]: { [hour: string]: string } } } = {};
            data.forEach((slot: TimetableSlot) => {
                if (!transformedData[slot.year]) {
                    transformedData[slot.year] = {};
                }
                if (!transformedData[slot.year][slot.day]) {
                    transformedData[slot.year][slot.day] = {};
                }
                transformedData[slot.year][slot.day][slot.hour] = slot.subject_name;
            });

            setTimetableData(prev => ({ // Merge with previous data or set entirely
                ...prev, // Keep data for other years if already loaded
                [selectedYear]: transformedData[selectedYear] || {} // Only update data for current selected year
            }));

        } catch (error: any) {
            console.error('Error loading timetable:', error);
            toast({ title: 'Error loading timetable', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear, supabaseOld, toast]); // Added selectedYear to dependencies to reload when year changes

    useEffect(() => {
        loadTimetableData();
        // Add realtime listener here only if you need instant updates for timetable,
        // otherwise, AdminDashboard's central listener is sufficient.
        // For local development, adding a specific listener here ensures updates without full page refresh.
        const timetableChannel = supabaseOld
            .channel(`timetable_slots_channel_${selectedYear}`) // Unique channel for each year
            .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_slots', filter: `year=eq.${selectedYear}` }, (payload) => {
                console.log("Timetable change detected:", payload);
                loadTimetableData(); // Reload data for the specific year
            })
            .subscribe();

        return () => {
            supabaseOld.removeChannel(timetableChannel);
        };
    }, [loadTimetableData, selectedYear, supabaseOld]); // Depends on selectedYear to subscribe/unsubscribe correctly

    const updateTimetableSlot = async (year: string, day: string, timeSlot: string, subject: string) => {
        setIsLoading(true); // Indicate loading for update operation
        try {
            // Find the slot by its unique combination of year, day, and hour (timeSlot)
            const { data: existingSlots, error: fetchError } = await supabaseOld
                .from('timetable_slots')
                .select('id')
                .eq('year', parseInt(year))
                .eq('day', day)
                .eq('hour', timeSlot);

            if (fetchError) throw fetchError;

            if (existingSlots && existingSlots.length > 0) {
                // Update existing slot using its ID
                const { error } = await supabaseOld
                    .from('timetable_slots')
                    .update({ subject_name: subject }) // Ensure subject_name matches DB
                    .eq('id', existingSlots[0].id);

                if (error) throw error;
                toast({ title: "Timetable slot updated successfully" });
            } else {
                // This case ideally shouldn't happen for an 'update' function, but as a fallback
                // it might insert if the combination doesn't exist.
                // However, for consistency, consider making update a more atomic operation by ID
                toast({ title: "Warning", description: "Time slot not found for update, attempting to insert.", variant: "warning" });
                const { error } = await supabaseOld
                    .from('timetable_slots')
                    .insert({
                        year: parseInt(year),
                        day: day,
                        hour: timeSlot,
                        subject_name: subject,
                        created_at: new Date().toISOString()
                    });
                if (error) throw error;
                toast({ title: "New time slot inserted as part of update fallback." });
            }

            loadTimetableData(); // Reload all data to ensure UI consistency

        } catch (error: any) {
            console.error('Error updating timetable:', error);
            toast({ title: "Error updating timetable", description: error.message || "Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSlot = async (year: string, day: string, timeSlot: string) => {
        setIsLoading(true); // Indicate loading for delete operation
        try {
            // Delete by year, day, hour (timeSlot) combination
            const { error } = await supabaseOld
                .from('timetable_slots')
                .delete()
                .eq('year', parseInt(year))
                .eq('day', day)
                .eq('hour', timeSlot);

            if (error) throw error;

            toast({ title: "Time slot deleted successfully" });
            loadTimetableData(); // Reload all data to ensure UI consistency
        } catch (error: any) {
            console.error('Error deleting slot:', error);
            toast({ title: "Error deleting slot", description: error.message || "Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSlot = async (slotData: { year: string; day: string; startTime: string; endTime: string; subject: string; faculty: string; room: string; }) => {
        const { year, day, startTime, endTime, subject, faculty, room } = slotData;

        // Convert 24-hour format to 12-hour format for display and storage consistency
        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        };

        const formattedTimeSlot = `${formatTime(startTime)}-${formatTime(endTime)}`;

        setIsLoading(true); // Indicate loading for add operation
        try {
            const { error } = await supabaseOld
                .from('timetable_slots') // Changed table name
                .insert({
                    year: parseInt(year),
                    day: day,
                    hour: formattedTimeSlot, // Storing combined time slot
                    subject_name: subject, // Using subject_name
                    faculty: faculty, // Assuming 'faculty' column also exists
                    room: room, // Assuming 'room' column also exists
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            toast({
                title: "New time slot added successfully",
                description: `${subject} added to ${day} at ${formattedTimeSlot}`
            });
            setShowAddSlot(false); // Close modal on success
            loadTimetableData(); // Refresh list
        } catch (error: any) {
            console.error('Error adding slot:', error);
            toast({ title: "Error adding slot", description: error.message || "Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const SlotEditModal = ({ slot, onSave, onClose }: { slot: TimetableSlot | null; onSave: (year: string, day: string, timeSlot: string, subject: string) => Promise<void>; onClose: () => void }) => {
        const [subject, setSubject] = useState(slot?.subject_name || ''); // Use subject_name
        const [faculty, setFaculty] = useState(slot?.faculty || ''); // Assuming faculty is editable
        const [room, setRoom] = useState(slot?.room || ''); // Assuming room is editable

        useEffect(() => {
            if (slot) {
                setSubject(slot.subject_name);
                setFaculty(slot.faculty || ''); // Initialize optional fields
                setRoom(slot.room || ''); // Initialize optional fields
            }
        }, [slot]);

        const handleSave = async () => {
            if (slot) {
                await onSave(slot.year.toString(), slot.day, slot.hour, subject); // Pass year as string for onSave
                // Also update faculty and room if they are directly in timetable_slots
                // For this, you would need an update function that takes more parameters or a full object
                // If faculty/room are stored in the timetable_slots table itself:
                const { error: updateError } = await supabaseOld
                    .from('timetable_slots')
                    .update({ faculty, room })
                    .eq('id', slot.id);
                if (updateError) {
                    toast({title: "Error updating faculty/room", description: updateError.message, variant: "destructive"});
                } else {
                    toast({title: "Faculty/Room updated"});
                }
            }
            onClose();
        };

        return (
            <Dialog open={!!slot} onOpenChange={onClose}>
                <DialogContent className="dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            Edit {slot?.day} - {slot?.hour}
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
                                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <Label htmlFor="faculty-edit">Faculty (Optional)</Label>
                            <Input
                                id="faculty-edit"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                placeholder="Enter faculty name"
                                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <Label htmlFor="room-edit">Room (Optional)</Label>
                            <Input
                                id="room-edit"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                placeholder="Enter room number"
                                className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <Button onClick={handleSave} disabled={isLoading} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button variant="outline" onClick={onClose} className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">Cancel</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    };

    // Get all unique time slots for the selected year and day
    const getTimeSlotsForDay = (year: string, day: string) => {
        // Ensure timetableData[year] and timetableData[year][day] exist before accessing
        const dayData = timetableData[year]?.[day] || {};
        return Object.keys(dayData).sort((a, b) => {
            // Custom sort for "HH:MM AM/PM" format
            const timeA = new Date(`2000/01/01 ${a.split('-')[0]}`);
            const timeB = new Date(`2000/01/01 ${b.split('-')[0]}`);
            return timeA.getTime() - timeB.getTime();
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-gray-100">Timetable Management</h2>
                <div className="flex gap-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger className="w-32 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                            <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                            {years.map(year => (
                                <SelectItem key={year} value={year} className="dark:text-gray-100 dark:hover:bg-gray-600">Year {year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        onClick={() => setShowAddSlot(true)}
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                        disabled={isLoading}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Slot
                    </Button>
                </div>
            </div>

            <Tabs value={selectedDay} className="w-full" onValueChange={setSelectedDay}>
                <TabsList className="grid w-full grid-cols-6 bg-gray-100 dark:bg-gray-700">
                    {days.map(day => (
                        <TabsTrigger key={day} value={day} className="data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            {day}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {days.map(day => (
                    <TabsContent key={day} value={day}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-center text-gray-900 dark:text-gray-100">
                                    <span>{day} - Year {selectedYear}</span>
                                    <Button 
                                        size="sm"
                                        onClick={() => setShowAddSlot(true)}
                                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                                        disabled={isLoading}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add to {day}
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isLoading && !timetableData[selectedYear]?.[day] ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                        <p>Loading slots...</p>
                                    </div>
                                ) : getTimeSlotsForDay(selectedYear, day).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p>No time slots scheduled for this day.</p>
                                        <p>Click "Add to {day}" to create your first time slot.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {getTimeSlotsForDay(selectedYear, day).map(timeSlot => {
                                            const slot = (timetableData[selectedYear]?.[day] as { [hour: string]: TimetableSlot })?.[timeSlot];
                                            if (!slot) return null; // Defensive check

                                            return (
                                                <div key={timeSlot} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700">
                                                    <div className="flex-1 text-gray-900 dark:text-gray-200">
                                                        <span className="font-medium text-sm">{slot.hour}</span>
                                                        <span className="ml-4 text-gray-700 dark:text-gray-300">{slot.subject_name}</span>
                                                        {slot.faculty && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({slot.faculty})</span>}
                                                        {slot.room && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">[Room: {slot.room}]</span>}
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setEditingSlot({
                                                                id: slot.id, // Pass ID for actual update
                                                                year: parseInt(selectedYear),
                                                                day: day,
                                                                hour: timeSlot,
                                                                subject_name: slot.subject_name,
                                                                faculty: slot.faculty,
                                                                room: slot.room,
                                                            })}
                                                            className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => deleteSlot(selectedYear, day, timeSlot)}
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    </div>
                                )}
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
