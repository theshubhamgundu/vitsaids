import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  IndianRupee, 
  ImageIcon,
  Plus,
  X,
  Save,
  Eye
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseApi } from '../../utils/supabaseApi';
import { showToast } from '../../utils/toast';
import { RegistrationFormBuilder } from './RegistrationFormBuilder';
import { RegistrationFormConfig, getDefaultRegistrationConfig } from './EventRegistrationForm';
import { NavigationHeader } from '../NavigationHeader';

interface EventForm {
  title: string;
  description: string;
  type: 'fest' | 'hackathon' | 'workshop' | 'cultural' | 'sports' | 'tech';
  date: string;
  time: string;
  venue: string;
  college: string;
  price: number;
  capacity: number;
  image: string;
  tags: string[];
  requirements: string[];
  prizes: string[];
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newPrize, setNewPrize] = useState('');
  const [showRegistrationBuilder, setShowRegistrationBuilder] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationFormConfig | null>(null);
  
  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    type: 'workshop',
    date: '',
    time: '',
    venue: '',
    college: user?.college || '',
    price: 0,
    capacity: 50,
    image: '',
    tags: [],
    requirements: [],
    prizes: []
  });

  const handleInputChange = (field: keyof EventForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // When event type changes, update registration config for form-required events
    if (field === 'type' && ['hackathon', 'ideathon', 'workshop'].includes(value)) {
      setRegistrationConfig(getDefaultRegistrationConfig(value));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !form.requirements.includes(newRequirement.trim())) {
      setForm(prev => ({ ...prev, requirements: [...prev.requirements, newRequirement.trim()] }));
      setNewRequirement('');
    }
  };

  const removeRequirement = (requirementToRemove: string) => {
    setForm(prev => ({ 
      ...prev, 
      requirements: prev.requirements.filter(req => req !== requirementToRemove) 
    }));
  };

  const addPrize = () => {
    if (newPrize.trim() && !form.prizes.includes(newPrize.trim())) {
      setForm(prev => ({ ...prev, prizes: [...prev.prizes, newPrize.trim()] }));
      setNewPrize('');
    }
  };

  const removePrize = (prizeToRemove: string) => {
    setForm(prev => ({ ...prev, prizes: prev.prizes.filter(prize => prize !== prizeToRemove) }));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!form.title.trim()) errors.push('Event title is required');
    if (!form.description.trim()) errors.push('Event description is required');
    if (!form.date) errors.push('Event date is required');
    if (!form.time) errors.push('Event time is required');
    if (!form.venue.trim()) errors.push('Venue is required');
    if (!form.college.trim()) errors.push('College is required');
    if (form.capacity < 1) errors.push('Capacity must be at least 1');
    if (form.price < 0) errors.push('Price cannot be negative');
    
    return errors;
  };

  const handleSubmit = async (isDraft = false) => {
    const errors = validateForm();
    
    if (!isDraft && errors.length > 0) {
      errors.forEach(error => showToast.error(error));
      return;
    }

    if (!user) {
      showToast.error('You must be logged in to create events');
      return;
    }

    // Restrict publishing for unapproved organizers
    if (!isDraft && user.type === 'organizer' && user.verificationStatus !== 'approved') {
      showToast.error('Your organizer account is not approved yet. Submit verification to publish.');
      return;
    }

    setLoading(true);

    try {
      const eventData = {
        ...form,
        organizer: user.name,
        organizerId: user.id,
        registered: 0,
        status: isDraft ? 'draft' as const : 'upcoming' as const,
        image: form.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'
      };

      const createdEvent = await supabaseApi.createEvent(eventData as any);
      
      // Optionally persist registration config to your backend if needed
      
      showToast.events.createSuccess(form.title);
      navigate(`/event/${createdEvent.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      showToast.events.createError();
    } finally {
      setLoading(false);
    }
  };

  // Show registration form builder if requested
  if (showRegistrationBuilder) {
    return (
      <RegistrationFormBuilder
        eventType={form.type}
        initialConfig={registrationConfig ?? undefined}
        onSave={(config) => {
          setRegistrationConfig(config);
          setShowRegistrationBuilder(false);
          showToast.success('Registration form configured successfully');
        }}
        onCancel={() => setShowRegistrationBuilder(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader 
        title="Create Event"
        backPath="/organizer-dashboard"
      />

      {/* Action Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => handleSubmit(true)}
              disabled={loading}
            >
              <Save size={16} className="mr-2" />
              Save Draft
            </Button>
            <Button 
              onClick={() => handleSubmit(false)}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Eye size={16} className="mr-2" />
              {loading ? 'Creating...' : 'Publish Event'}
            </Button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter event title..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your event..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Event Type *</Label>
                    <Select value={form.type} onValueChange={(value) => handleInputChange('type', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fest">Fest</SelectItem>
                        <SelectItem value="hackathon">Hackathon</SelectItem>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="cultural">Cultural</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="tech">Tech Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="college">College *</Label>
                    <Input
                      id="college"
                      value={form.college}
                      onChange={(e) => handleInputChange('college', e.target.value)}
                      placeholder="Your college name..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date, Time & Venue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar size={20} className="mr-2" />
                  Date, Time & Venue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Event Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={form.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="time">Event Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={form.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    value={form.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="Event venue or location..."
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Capacity & Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users size={20} className="mr-2" />
                  Capacity & Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="capacity">Event Capacity *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Registration Price (₹)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                      placeholder="0 for free events"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to 0 for free events
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Registration Form Setup */}
            {['hackathon', 'workshop'].includes(form.type) && (
              <Card>
                <CardHeader>
                  <CardTitle>Registration Form</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Custom Registration Form</Label>
                      <p className="text-sm text-muted-foreground">
                        Configure fields for participant registration
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowRegistrationBuilder(true)}
                    >
                      {registrationConfig ? 'Edit Form' : 'Setup Form'}
                    </Button>
                  </div>
                  
                  {registrationConfig && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Registration form configured
                        </span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {registrationConfig.fields.length} field{registrationConfig.fields.length !== 1 ? 's' : ''} • 
                        {registrationConfig.teamBased ? ' Team-based' : ' Individual'} event
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tags */}
                <div>
                  <Label>Event Tags</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  {form.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Requirements */}
                <div>
                  <Label>Requirements</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="Add a requirement..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    />
                    <Button type="button" onClick={addRequirement} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  {form.requirements.length > 0 && (
                    <ul className="space-y-2 mt-2">
                      {form.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{requirement}</span>
                          <button
                            type="button"
                            onClick={() => removeRequirement(requirement)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Prizes */}
                <div>
                  <Label>Prizes & Rewards</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      value={newPrize}
                      onChange={(e) => setNewPrize(e.target.value)}
                      placeholder="Add a prize..."
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrize())}
                    />
                    <Button type="button" onClick={addPrize} size="sm">
                      <Plus size={16} />
                    </Button>
                  </div>
                  {form.prizes.length > 0 && (
                    <ul className="space-y-2 mt-2">
                      {form.prizes.map((prize, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{prize}</span>
                          <button
                            type="button"
                            onClick={() => removePrize(prize)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Event Image */}
                <div>
                  <Label htmlFor="image">Event Image URL</Label>
                  <Input
                    id="image"
                    value={form.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to use a default image
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye size={20} className="mr-2" />
                  Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Event Type Badge */}
                {form.type && (
                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                    {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
                  </Badge>
                )}

                {/* Title */}
                <h3 className="font-semibold text-lg">
                  {form.title || 'Event Title'}
                </h3>

                {/* College */}
                <p className="text-sm text-muted-foreground">
                  {form.college || 'College Name'}
                </p>

                {/* Date & Time */}
                {(form.date || form.time) && (
                  <div className="space-y-1">
                    {form.date && (
                      <div className="flex items-center text-sm">
                        <Calendar size={14} className="mr-2" />
                        <span>{new Date(form.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {form.time && (
                      <div className="flex items-center text-sm">
                        <Clock size={14} className="mr-2" />
                        <span>{form.time}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Venue */}
                {form.venue && (
                  <div className="flex items-center text-sm">
                    <MapPin size={14} className="mr-2" />
                    <span>{form.venue}</span>
                  </div>
                )}

                {/* Capacity & Price */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Users size={14} className="mr-2" />
                    <span>0 / {form.capacity}</span>
                  </div>
                  <div className="flex items-center font-medium">
                    {form.price === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <div className="flex items-center text-orange-600">
                        <IndianRupee size={14} className="mr-1" />
                        <span>{form.price}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tags Preview */}
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {form.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{form.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Description Preview */}
                {form.description && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Description</h4>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {form.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}