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
import { SupabaseClient } from '@supabase/supabase-js';
import AddSlotModal from './AddSlotModal';

// Define interface for TimetableSlot as expected by the DB and component
interface TimetableSlot {
    id: string;
    year: number; // Storing as number
    day: string;
    hour: string; // Storing formatted time slot like "9:00 AM-10:00 AM"
    subject_name: string; // Corrected column name
    faculty?: string; // Optional faculty column
    room?: string; // Optional room column
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
    const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
    const [showAddSlot, setShowAddSlot] = useState(false);
    const [selectedDay, setSelectedDay] = useState('Monday');
    // Using a more structured state to easily access nested data and prevent errors for non-existent year/day
    const [timetableData, setTimetableData] = useState<{ [year: string]: { [day: string]: { [hour: string]: TimetableSlot } } }>({});
    const [isLoading, setIsLoading] = useState(false);

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const years = ['1', '2', '3', '4'];

    // Load timetable data from database
    const loadTimetableData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use supabaseOld as confirmed for timetable
            const { data, error } = await supabaseOld
                .from('timetable_slots')
                .select('*')
                .order('year', { ascending: true }) // Order by year for full data load
                .order('hour', { ascending: true }); // Then by hour

            if (error) {
                console.error('Error loading timetable data:', error);
                toast({ title: 'Error loading timetable', description: error.message || 'Please check Supabase "timetable_slots" table.', variant: 'destructive' });
                return;
            }

            // Transform data into the expected nested format
            const transformedData: { [year: string]: { [day: string]: { [hour: string]: TimetableSlot } } } = {};
            data.forEach((slot: TimetableSlot) => {
                const yearStr = slot.year.toString();
                if (!transformedData[yearStr]) {
                    transformedData[yearStr] = {};
                }
                if (!transformedData[yearStr][slot.day]) {
                    transformedData[yearStr][slot.day] = {};
                }
                transformedData[yearStr][slot.day][slot.hour] = slot; // Store the full slot object
            });

            setTimetableData(transformedData); // Set the full transformed data

        } catch (error: any) {
            console.error('Error loading timetable:', error);
            toast({ title: 'Error loading timetable', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [supabaseOld, toast]);

    useEffect(() => {
        loadTimetableData();
        
        // Realtime subscription for timetable changes
        const timetableChannel = supabaseOld
            .channel('timetable_slots_changes_all') // A single channel for all timetable changes
            .on('postgres_changes', { event: '*', schema: 'public', table: 'timetable_slots' }, (payload) => {
                console.log("Timetable change detected:", payload);
                loadTimetableData(); // Reload all data on any change
            })
            .subscribe();

        return () => {
            supabaseOld.removeChannel(timetableChannel);
        };
    }, [loadTimetableData, supabaseOld]);

    const updateTimetableSlot = async (slotId: string, updatedFields: Partial<TimetableSlot>) => {
        setIsLoading(true);
        try {
            // Update using the slot ID
            const { error } = await supabaseOld
                .from('timetable_slots')
                .update(updatedFields)
                .eq('id', slotId);

            if (error) throw error;
            toast({ title: "Timetable slot updated successfully" });
            loadTimetableData(); // Reload all data to ensure UI consistency
        } catch (error: any) {
            console.error('Error updating timetable:', error);
            toast({ title: "Error updating timetable", description: error.message || "Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSlot = async (slotId: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this timetable slot? This cannot be undone.");
        if (!confirmDelete) return;

        setIsLoading(true);
        try {
            const { error } = await supabaseOld
                .from('timetable_slots')
                .delete()
                .eq('id', slotId); // Delete by ID

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

        const formatTime = (time: string) => {
            const [hours, minutes] = time.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            return `${displayHour}:${minutes} ${ampm}`;
        };

        const formattedTimeSlot = `${formatTime(startTime)}-${formatTime(endTime)}`;

        setIsLoading(true);
        try {
            const { error } = await supabaseOld
                .from('timetable_slots')
                .insert({
                    year: parseInt(year),
                    day: day,
                    hour: formattedTimeSlot,
                    subject_name: subject,
                    faculty: faculty,
                    room: room,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            toast({
                title: "New time slot added successfully",
                description: `${subject} added to ${day} at ${formattedTimeSlot}`
            });
            setShowAddSlot(false);
            loadTimetableData();
        } catch (error: any) {
            console.error('Error adding slot:', error);
            toast({ title: "Error adding slot", description: error.message || "Please try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // SlotEditModal moved inside TimetableManager to directly access its states and functions
    const SlotEditModal = ({ slot, onSave, onClose }: { slot: TimetableSlot | null; onSave: (id: string, updatedFields: Partial<TimetableSlot>) => Promise<void>; onClose: () => void }) => {
        const [subject, setSubject] = useState('');
        const [faculty, setFaculty] = useState('');
        const [room, setRoom] = useState('');

        useEffect(() => {
            if (slot) {
                setSubject(slot.subject_name);
                setFaculty(slot.faculty || '');
                setRoom(slot.room || '');
            } else {
                // Reset state when modal is closed or slot is nullified
                setSubject('');
                setFaculty('');
                setRoom('');
            }
        }, [slot]);

        const handleSave = async () => {
            if (slot) {
                await onSave(slot.id, { subject_name: subject, faculty: faculty, room: room });
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
    const getTimeSlotsForDay = useCallback((year: string, day: string) => {
        const dayData = timetableData[year]?.[day] || {};
        return Object.keys(dayData).sort((a, b) => {
            // Robust time parsing for sorting "HH:MM AM/PM" format
            const parseTime = (timeStr: string) => {
                const [timePart] = timeStr.split('-');
                const [time, ampm] = timePart.split(' ');

                let [hours, minutes] = time.split(':').map(Number);

                if (ampm) {
                    if (ampm.toUpperCase() === 'PM' && hours < 12) {
                        hours += 12;
                    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
                        hours = 0; // Midnight (12 AM) is 0 hours
                    }
                }
                return hours * 60 + minutes; // Convert to minutes from midnight for easy comparison
            };

            const minutesA = parseTime(a);
            const minutesB = parseTime(b);
            return minutesA - minutesB;
        });
    }, [timetableData]); // Include timetableData in dependencies for useCallback

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
                                {isLoading && (!timetableData[selectedYear] || Object.keys(timetableData[selectedYear][day] || {}).length === 0) ? (
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
                                        {getTimeSlotsForDay(selectedYear, day).map(timeSlotKey => { // Use timeSlotKey
                                            const slot = timetableData[selectedYear]?.[day]?.[timeSlotKey]; // Retrieve full slot object
                                            if (!slot) return null;

                                            return (
                                                <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg dark:border-gray-600 dark:bg-gray-700">
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
                                                            onClick={() => setEditingSlot(slot)} // Pass the whole slot object
                                                            className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-600"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => deleteSlot(slot.id)} // Pass ID for deletion
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            <SlotEditModal
                slot={editingSlot}
                onSave={updateTimetableSlot} // Pass the correct update function
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
