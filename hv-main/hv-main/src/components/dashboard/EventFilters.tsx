import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { X, MapPin, Calendar, IndianRupee, Filter } from 'lucide-react';

interface EventFiltersProps {
  filters: {
    college: string;
    eventType: string;
    dateRange: string;
    priceRange: string;
    distance: string;
  };
  onFiltersChange: (filters: any) => void;
}

const collegeOptions = [
  'All Colleges',
  'IIT Delhi',
  'IIT Bombay',
  'IIT Madras',
  'BITS Pilani',
  'NIT Trichy',
  'Delhi University',
  'JNU',
  'NSUT Delhi'
];

const eventTypes = [
  { id: 'all', label: 'All Events' },
  { id: 'fest', label: 'College Fests' },
  { id: 'hackathon', label: 'Hackathons' },
  { id: 'cultural', label: 'Cultural Events' },
  { id: 'sports', label: 'Sports' },
  { id: 'workshop', label: 'Workshops' }
];

const dateRanges = [
  'Any time',
  'Today',
  'This week',
  'This month',
  'Next 3 months'
];

const priceRanges = [
  'Any price',
  'Free only',
  'Under ₹100',
  '₹100 - ₹500',
  'Above ₹500'
];

const distanceOptions = [
  'Any distance',
  'Within 5 km',
  'Within 15 km',
  'Within 50 km',
  'Same city'
];

export function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      college: '',
      eventType: '',
      dateRange: '',
      priceRange: '',
      distance: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Filter size={18} className="mr-2" />
              Filter Events
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X size={14} className="mr-2" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* College Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-muted-foreground" />
              <label className="text-sm font-medium">College</label>
            </div>
            <Select onValueChange={(value) => updateFilter('college', value)} value={filters.college}>
              <SelectTrigger>
                <SelectValue placeholder="Select college" />
              </SelectTrigger>
              <SelectContent>
                {collegeOptions.map((college) => (
                  <SelectItem key={college} value={college}>
                    {college}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Event Type Filter */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Event Type</label>
            <div className="grid grid-cols-2 gap-3">
              {eventTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={filters.eventType === type.id}
                    onCheckedChange={(checked) => 
                      updateFilter('eventType', checked ? type.id : '')
                    }
                  />
                  <label htmlFor={type.id} className="text-sm cursor-pointer">
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Date Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar size={16} className="text-muted-foreground" />
              <label className="text-sm font-medium">Date Range</label>
            </div>
            <Select onValueChange={(value) => updateFilter('dateRange', value)} value={filters.dateRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Price Range Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <IndianRupee size={16} className="text-muted-foreground" />
              <label className="text-sm font-medium">Price Range</label>
            </div>
            <Select onValueChange={(value) => updateFilter('priceRange', value)} value={filters.priceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Select price range" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map((range) => (
                  <SelectItem key={range} value={range}>
                    {range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Distance Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-muted-foreground" />
              <label className="text-sm font-medium">Distance</label>
            </div>
            <Select onValueChange={(value) => updateFilter('distance', value)} value={filters.distance}>
              <SelectTrigger>
                <SelectValue placeholder="Select distance" />
              </SelectTrigger>
              <SelectContent>
                {distanceOptions.map((distance) => (
                  <SelectItem key={distance} value={distance}>
                    {distance}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm font-medium mb-3">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (!value) return null;
                  return (
                    <motion.div
                      key={key}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md text-xs flex items-center space-x-1"
                    >
                      <span>{value}</span>
                      <button
                        onClick={() => updateFilter(key, '')}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}