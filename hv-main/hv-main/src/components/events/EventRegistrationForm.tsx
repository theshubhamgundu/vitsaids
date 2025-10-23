import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  Trophy, 
  Code, 
  Users, 
  Clock,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { showToast } from '../../utils/toast';

export interface RegistrationField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
  label: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

export interface RegistrationFormConfig {
  title: string;
  description: string;
  fields: RegistrationField[];
  teamBased: boolean;
  maxTeamSize?: number;
  minTeamSize?: number;
  allowIndividual?: boolean;
}

interface EventRegistrationFormProps {
  eventTitle: string;
  eventType: string;
  registrationConfig: RegistrationFormConfig;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
}

// Default form configurations for different event types
export const getDefaultRegistrationConfig = (eventType: string): RegistrationFormConfig => {
  switch (eventType) {
    case 'hackathon':
      return {
        title: 'Hackathon Registration',
        description: 'Join our intensive 48-hour coding challenge and build innovative solutions that matter.',
        teamBased: true,
        maxTeamSize: 4,
        minTeamSize: 2,
        allowIndividual: false,
        fields: [
          {
            id: 'participantName',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full legal name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'your.email@university.edu'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            placeholder: '+91 9876543210'
          },
          {
            id: 'college',
            type: 'text',
            label: 'College/University',
            required: true,
            placeholder: 'Your institution name'
          },
          {
            id: 'studentId',
            type: 'text',
            label: 'Student ID',
            required: true,
            placeholder: 'Your college ID number'
          },
          {
            id: 'year',
            type: 'select',
            label: 'Year of Study',
            required: true,
            options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'PhD Scholar']
          },
          {
            id: 'major',
            type: 'select',
            label: 'Field of Study',
            required: true,
            options: ['Computer Science', 'Information Technology', 'Electronics Engineering', 'Software Engineering', 'Data Science', 'Other Engineering', 'Other']
          },
          {
            id: 'experience',
            type: 'select',
            label: 'Programming Experience',
            required: true,
            options: ['Beginner (< 1 year)', 'Intermediate (1-3 years)', 'Advanced (3-5 years)', 'Expert (5+ years)']
          },
          {
            id: 'skills',
            type: 'textarea',
            label: 'Technical Skills & Expertise',
            required: true,
            placeholder: 'List your programming languages, frameworks, tools, and technical skills (e.g., Python, React, AWS, Machine Learning, etc.)',
            description: 'This helps us form balanced teams and provide relevant resources'
          },
          {
            id: 'preferredRole',
            type: 'select',
            label: 'Preferred Role in Team',
            required: true,
            options: ['Team Leader/Project Manager', 'Full-Stack Developer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer', 'UI/UX Designer', 'Data Scientist/ML Engineer', 'DevOps Engineer', 'Quality Assurance']
          },
          {
            id: 'githubProfile',
            type: 'text',
            label: 'GitHub Profile',
            required: true,
            placeholder: 'https://github.com/yourusername'
          },
          {
            id: 'linkedinProfile',
            type: 'text',
            label: 'LinkedIn Profile (Optional)',
            required: false,
            placeholder: 'https://linkedin.com/in/yourprofile'
          },
          {
            id: 'portfolioWebsite',
            type: 'text',
            label: 'Portfolio Website (Optional)',
            required: false,
            placeholder: 'https://yourportfolio.com'
          },
          {
            id: 'problemInterest',
            type: 'select',
            label: 'Problem Domain Interest',
            required: true,
            options: ['FinTech/Finance', 'HealthTech/Medical', 'EdTech/Education', 'E-commerce/Retail', 'Social Impact/NGO', 'Climate Change/Environment', 'AI/Machine Learning', 'Blockchain/Web3', 'IoT/Hardware', 'Open to Any Domain']
          },
          {
            id: 'hackathonExperience',
            type: 'select',
            label: 'Previous Hackathon Experience',
            required: true,
            options: ['This is my first hackathon', '1-2 hackathons', '3-5 hackathons', '5+ hackathons', 'I organize hackathons']
          },
          {
            id: 'expectations',
            type: 'textarea',
            label: 'What do you hope to achieve?',
            required: true,
            placeholder: 'Describe what you want to learn, build, or accomplish during this hackathon',
            description: 'Help us understand your goals and motivations'
          },
          {
            id: 'teamName',
            type: 'text',
            label: 'Team Name (if creating team)',
            required: false,
            placeholder: 'Choose a creative team name'
          },
          {
            id: 'dietaryRestrictions',
            type: 'textarea',
            label: 'Dietary Restrictions & Allergies',
            required: false,
            placeholder: 'List any dietary restrictions, food allergies, or special meal requirements'
          },
          {
            id: 'emergencyContact',
            type: 'text',
            label: 'Emergency Contact Name',
            required: true,
            placeholder: 'Emergency contact person name'
          },
          {
            id: 'emergencyPhone',
            type: 'phone',
            label: 'Emergency Contact Number',
            required: true,
            placeholder: 'Emergency contact phone number'
          },
          {
            id: 'tshirtSize',
            type: 'select',
            label: 'T-Shirt Size',
            required: true,
            options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
          },
          {
            id: 'agreeCodeConduct',
            type: 'checkbox',
            label: 'I agree to follow the Code of Conduct and maintain a respectful environment',
            required: true
          },
          {
            id: 'agreeTerms',
            type: 'checkbox',
            label: 'I agree to the terms and conditions, privacy policy, and photo/video consent',
            required: true
          },
          {
            id: 'subscribeUpdates',
            type: 'checkbox',
            label: 'I would like to receive updates about future hackathons and tech events',
            required: false
          }
        ]
      };

    case 'ideathon':
      return {
        title: 'Ideathon Registration',
        description: 'Transform your innovative ideas into winning solutions. Join the next generation of entrepreneurs and changemakers.',
        teamBased: true,
        maxTeamSize: 5,
        minTeamSize: 1,
        allowIndividual: true,
        fields: [
          {
            id: 'participantName',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full legal name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'your.email@university.edu'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            placeholder: '+91 9876543210'
          },
          {
            id: 'college',
            type: 'text',
            label: 'College/University',
            required: true,
            placeholder: 'Your institution name'
          },
          {
            id: 'year',
            type: 'select',
            label: 'Year of Study',
            required: true,
            options: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate Student', 'PhD Scholar', 'Alumni', 'Professional']
          },
          {
            id: 'field',
            type: 'select',
            label: 'Field of Study/Expertise',
            required: true,
            options: ['Engineering & Technology', 'Business & Management', 'Design & Arts', 'Science & Research', 'Medicine & Healthcare', 'Social Sciences', 'Law & Policy', 'Economics & Finance', 'Other']
          },
          {
            id: 'participationType',
            type: 'radio',
            label: 'Participation Type',
            required: true,
            options: ['Individual', 'Team']
          },
          {
            id: 'teamRole',
            type: 'select',
            label: 'Your Role/Expertise',
            required: true,
            options: ['Ideator/Visionary', 'Business Strategist', 'Technical Lead', 'Designer/Creative', 'Market Research', 'Financial Analyst', 'Product Manager', 'Domain Expert']
          },
          {
            id: 'teamName',
            type: 'text',
            label: 'Team Name (if participating in team)',
            required: false,
            placeholder: 'Choose a memorable team name'
          },
          {
            id: 'ideaCategory',
            type: 'select',
            label: 'Primary Focus Area',
            required: true,
            options: ['FinTech & Finance', 'HealthTech & Medical', 'EdTech & Learning', 'CleanTech & Environment', 'Social Impact & NGO', 'AgriTech & Food', 'Smart Cities & Urban Planning', 'E-commerce & Retail', 'Entertainment & Media', 'Other Innovation']
          },
          {
            id: 'problemStatement',
            type: 'textarea',
            label: 'Problem Statement',
            required: true,
            placeholder: 'What specific problem are you trying to solve? Who does it affect and how?',
            description: 'Clearly define the problem your idea addresses'
          },
          {
            id: 'solutionOverview',
            type: 'textarea',
            label: 'Solution Overview',
            required: true,
            placeholder: 'Describe your proposed solution and how it addresses the problem',
            description: 'Give us a clear picture of your innovative solution'
          },
          {
            id: 'targetAudience',
            type: 'text',
            label: 'Target Audience',
            required: true,
            placeholder: 'Who is your primary target audience or customer?'
          },
          {
            id: 'uniqueValue',
            type: 'textarea',
            label: 'Unique Value Proposition',
            required: true,
            placeholder: 'What makes your idea unique? How is it different from existing solutions?',
            description: 'Explain your competitive advantage'
          },
          {
            id: 'implementationPlan',
            type: 'textarea',
            label: 'Implementation Strategy',
            required: true,
            placeholder: 'How do you plan to implement this idea? What resources would you need?',
            description: 'Show us you have thought about execution'
          },
          {
            id: 'impact',
            type: 'textarea',
            label: 'Expected Impact',
            required: true,
            placeholder: 'What positive impact do you expect your idea to have on society, users, or the industry?'
          },
          {
            id: 'experience',
            type: 'select',
            label: 'Previous Innovation/Entrepreneurship Experience',
            required: true,
            options: ['No prior experience', 'Participated in competitions', 'Led student projects', 'Internship in startups', 'Founded a venture', 'Professional experience in innovation']
          },
          {
            id: 'skills',
            type: 'textarea',
            label: 'Relevant Skills & Experience',
            required: true,
            placeholder: 'What skills, knowledge, or experience do you bring to this ideathon?',
            description: 'Help us understand your strengths'
          },
          {
            id: 'motivation',
            type: 'textarea',
            label: 'Motivation & Goals',
            required: true,
            placeholder: 'What motivates you to participate? What do you hope to achieve or learn?'
          },
          {
            id: 'additionalInfo',
            type: 'textarea',
            label: 'Additional Information',
            required: false,
            placeholder: 'Anything else you would like us to know about you or your idea?'
          },
          {
            id: 'agreeCodeConduct',
            type: 'checkbox',
            label: 'I agree to maintain professional conduct and respect intellectual property rights',
            required: true
          },
          {
            id: 'agreeTerms',
            type: 'checkbox',
            label: 'I agree to the terms and conditions and privacy policy',
            required: true
          },
          {
            id: 'newsletterOptIn',
            type: 'checkbox',
            label: 'I would like to receive updates about future innovation events and opportunities',
            required: false
          }
        ]
      };

    case 'workshop':
      return {
        title: 'Workshop Registration',
        description: 'Enhance your skills with our expert-led workshop sessions.',
        teamBased: false,
        fields: [
          {
            id: 'participantName',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'your.email@example.com'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            placeholder: '+91 9876543210'
          },
          {
            id: 'college',
            type: 'text',
            label: 'College/University',
            required: true,
            placeholder: 'Your institution name'
          },
          {
            id: 'experience',
            type: 'select',
            label: 'Experience Level',
            required: true,
            options: ['Beginner', 'Intermediate', 'Advanced']
          },
          {
            id: 'expectations',
            type: 'textarea',
            label: 'What do you expect to learn?',
            required: true,
            placeholder: 'Share your learning expectations from this workshop'
          },
          {
            id: 'laptopRequired',
            type: 'checkbox',
            label: 'I will bring my laptop (if required)',
            required: false
          },
          {
            id: 'agreeTerms',
            type: 'checkbox',
            label: 'I agree to the terms and conditions',
            required: true
          }
        ]
      };

    default:
      return {
        title: 'Event Registration',
        description: 'Please fill out your details to register for this event.',
        teamBased: false,
        fields: [
          {
            id: 'participantName',
            type: 'text',
            label: 'Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'email',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'your.email@example.com'
          },
          {
            id: 'phone',
            type: 'phone',
            label: 'Phone Number',
            required: true,
            placeholder: '+91 9876543210'
          },
          {
            id: 'college',
            type: 'text',
            label: 'College/University',
            required: true,
            placeholder: 'Your institution name'
          },
          {
            id: 'agreeTerms',
            type: 'checkbox',
            label: 'I agree to the terms and conditions',
            required: true
          }
        ]
      };
  }
};

export function EventRegistrationForm({ 
  eventTitle, 
  eventType, 
  registrationConfig, 
  onSubmit, 
  onCancel 
}: EventRegistrationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teamRegistrationType, setTeamRegistrationType] = useState<'create' | 'join' | ''>('');
  const [teamMembers, setTeamMembers] = useState<Array<{
    name: string;
    email: string;
    role: string;
    skills?: string;
  }>>([]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => ({ ...prev, [fieldId]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    registrationConfig.fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        newErrors[field.id] = `${field.label} is required`;
      }

      // Email validation
      if (field.type === 'email' && formData[field.id]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }

      // Phone validation
      if (field.type === 'phone' && formData[field.id]) {
        const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
        if (!phoneRegex.test(formData[field.id])) {
          newErrors[field.id] = 'Please enter a valid phone number';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast.error('Please fix the errors and try again');
      return;
    }

    // For team-based events, include team information
    const submissionData = {
      ...formData,
      ...(registrationConfig.teamBased && {
        teamRegistrationType,
        teamMembers: teamMembers.length > 0 ? teamMembers : undefined
      })
    };

    setIsSubmitting(true);
    try {
      await onSubmit(submissionData);
      showToast.success('Registration submitted successfully!');
    } catch (error) {
      showToast.error('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTeamMember = () => {
    if (teamMembers.length < (registrationConfig.maxTeamSize || 4) - 1) {
      setTeamMembers([...teamMembers, { name: '', email: '', role: '' }]);
    }
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setTeamMembers(updatedMembers);
  };

  const renderField = (field: RegistrationField) => {
    const fieldError = errors[field.id];
    const fieldValue = formData[field.id] || '';

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center">
              {field.type === 'email' && <Mail size={16} className="mr-2" />}
              {field.type === 'phone' && <Phone size={16} className="mr-2" />}
              {field.type === 'text' && <User size={16} className="mr-2" />}
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type === 'phone' ? 'tel' : field.type}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={fieldError ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {fieldError}
              </p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center">
              <FileText size={16} className="mr-2" />
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={4}
              className={fieldError ? 'border-red-500' : ''}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
            {fieldError && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {fieldError}
              </p>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="flex items-center">
              <School size={16} className="mr-2" />
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={fieldValue}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {fieldError}
              </p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="flex items-center">
              <Users size={16} className="mr-2" />
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              {field.options?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                  <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {fieldError && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {fieldError}
              </p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id={field.id}
                checked={fieldValue === true}
                onCheckedChange={(checked) => handleInputChange(field.id, checked)}
                className={fieldError ? 'border-red-500' : ''}
              />
              <Label htmlFor={field.id} className="text-sm leading-5">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </div>
            {fieldError && (
              <p className="text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {fieldError}
              </p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Trophy size={24} className="text-blue-500" />
            <span>{registrationConfig.title}</span>
          </CardTitle>
          <p className="text-muted-foreground">
            {registrationConfig.description}
          </p>
          <div className="flex justify-center">
            <Badge variant="outline" className="text-sm">
              {eventType.charAt(0).toUpperCase() + eventType.slice(1)} • {eventTitle}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Information */}
            {registrationConfig.teamBased && (
              <>
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Users size={20} className="text-blue-500" />
                    <h3 className="text-lg font-medium">Team Information</h3>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle size={16} className="text-blue-500" />
                      <span className="font-medium">Team Requirements:</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Team size: {registrationConfig.minTeamSize}-{registrationConfig.maxTeamSize} members</li>
                      {registrationConfig.allowIndividual && <li>• Individual participation is allowed</li>}
                      <li>• You can create a new team or join an existing one</li>
                      <li>• Team leader will coordinate with all members</li>
                    </ul>
                  </div>

                  {/* Team Registration Type */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Team Registration</Label>
                    <RadioGroup
                      value={teamRegistrationType}
                      onValueChange={(value) => setTeamRegistrationType(value as '' | 'join' | 'create')}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="create" id="create-team" />
                        <Label htmlFor="create-team" className="cursor-pointer flex-1">
                          <div>
                            <p className="font-medium">Create New Team</p>
                            <p className="text-sm text-muted-foreground">
                              Form a new team and invite members to join
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <RadioGroupItem value="join" id="join-team" />
                        <Label htmlFor="join-team" className="cursor-pointer flex-1">
                          <div>
                            <p className="font-medium">Join Existing Team</p>
                            <p className="text-sm text-muted-foreground">
                              Join a team using team code or invitation
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Create Team Section */}
                  {teamRegistrationType === 'create' && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10">
                      <h4 className="font-medium flex items-center">
                        <Users size={16} className="mr-2" />
                        Team Details
                      </h4>
                      
                      {/* Team members */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Team Members ({teamMembers.length + 1}/{registrationConfig.maxTeamSize})</Label>
                          {teamMembers.length < (registrationConfig.maxTeamSize || 4) - 1 && (
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={addTeamMember}
                            >
                              Add Member
                            </Button>
                          )}
                        </div>
                        
                        {/* You as team leader */}
                        <div className="p-3 border rounded-lg bg-white dark:bg-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">You (Team Leader)</span>
                            <Badge variant="default" className="text-xs">Leader</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formData.participantName || 'Your name'} • {formData.email || 'Your email'}
                          </p>
                        </div>

                        {/* Team members */}
                        {teamMembers.map((member, index) => (
                          <div key={`team-member-${index}-${member.email}`} className="p-3 border rounded-lg bg-white dark:bg-gray-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Team Member {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTeamMember(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Remove
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                placeholder="Member name"
                                value={member.name}
                                onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                              />
                              <Input
                                type="email"
                                placeholder="Member email"
                                value={member.email}
                                onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Select
                                value={member.role}
                                onValueChange={(value) => updateTeamMember(index, 'role', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                                  <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                                  <SelectItem value="UI/UX Designer">UI/UX Designer</SelectItem>
                                  <SelectItem value="Data Scientist">Data Scientist</SelectItem>
                                  <SelectItem value="Product Manager">Product Manager</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {eventType === 'hackathon' && (
                                <Textarea
                                  placeholder="Technical skills and experience (optional)"
                                  value={member.skills || ''}
                                  onChange={(e) => updateTeamMember(index, 'skills', e.target.value)}
                                  rows={2}
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Join Team Section */}
                  {teamRegistrationType === 'join' && (
                    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
                      <h4 className="font-medium flex items-center">
                        <Users size={16} className="mr-2" />
                        Join Team
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="teamCode">Team Code or Invitation Link</Label>
                          <Input
                            id="teamCode"
                            placeholder="Enter team code (e.g., TEAM2024ABC)"
                            value={formData.teamCode || ''}
                            onChange={(e) => handleInputChange('teamCode', e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Get the team code from your team leader
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User size={20} className="text-green-500" />
                <h3 className="text-lg font-medium">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registrationConfig.fields.map((field) => renderField(field))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} className="mr-2" />
                    Submit Registration
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}