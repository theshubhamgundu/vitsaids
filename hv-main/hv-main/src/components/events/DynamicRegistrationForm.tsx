import React, { useState, useEffect } from 'react';
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
  Users, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Code,
  Award,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Minus,
  UserPlus
} from 'lucide-react';

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'number' 
  | 'date'
  | 'team'
  | 'skills'
  | 'file';

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: FormFieldOption[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  section?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface RegistrationFormConfig {
  title: string;
  description?: string;
  sections: FormSection[];
  teamRequired?: boolean;
  minTeamSize?: number;
  maxTeamSize?: number;
}

export interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  college?: string;
  year?: string;
  role?: string;
  skills?: string[];
}

export interface DynamicRegistrationFormProps {
  eventTitle: string;
  eventType: string;
  config: RegistrationFormConfig;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const skillOptions = [
  'Frontend Development', 'Backend Development', 'Full Stack', 'Mobile Development',
  'UI/UX Design', 'Data Science', 'Machine Learning', 'AI', 'Blockchain',
  'DevOps', 'Cloud Computing', 'Cybersecurity', 'Game Development',
  'Python', 'JavaScript', 'React', 'Node.js', 'Java', 'C++', 'Swift',
  'Flutter', 'React Native', 'Unity', 'Figma', 'Adobe Creative Suite'
];

export function DynamicRegistrationForm({ 
  eventTitle, 
  eventType, 
  config, 
  onSubmit, 
  onCancel 
}: DynamicRegistrationFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { name: '', email: '', phone: '', college: '', year: '', role: '', skills: [] }
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);

  useEffect(() => {
    // Initialize form data with default values
    const initialData: Record<string, any> = {};
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.type === 'checkbox') {
          initialData[field.name] = [];
        } else if (field.type === 'skills') {
          initialData[field.name] = [];
        } else {
          initialData[field.name] = '';
        }
      });
    });
    setFormData(initialData);
  }, [config]);

  const validateField = (field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const { minLength, maxLength, min, max, pattern } = field.validation;
      
      if (typeof value === 'string') {
        if (minLength && value.length < minLength) {
          return `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength && value.length > maxLength) {
          return `${field.label} must be at most ${maxLength} characters`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return `${field.label} format is invalid`;
        }
      }
      
      if (typeof value === 'number') {
        if (min !== undefined && value < min) {
          return `${field.label} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
          return `${field.label} must be at most ${max}`;
        }
      }
    }

    return null;
  };

  const validateTeamMembers = (): Record<string, string> => {
    const teamErrors: Record<string, string> = {};
    
    if (config.teamRequired) {
      const validMembers = teamMembers.filter(member => member.name.trim() && member.email.trim());
      
      if (config.minTeamSize && validMembers.length < config.minTeamSize) {
        teamErrors.team = `Team must have at least ${config.minTeamSize} members`;
      }
      
      if (config.maxTeamSize && validMembers.length > config.maxTeamSize) {
        teamErrors.team = `Team cannot have more than ${config.maxTeamSize} members`;
      }

      teamMembers.forEach((member, index) => {
        if (member.name.trim() || member.email.trim()) {
          if (!member.name.trim()) {
            teamErrors[`team_${index}_name`] = 'Name is required';
          }
          if (!member.email.trim()) {
            teamErrors[`team_${index}_email`] = 'Email is required';
          } else if (!/\S+@\S+\.\S+/.test(member.email)) {
            teamErrors[`team_${index}_email`] = 'Email is invalid';
          }
        }
      });
    }

    return teamErrors;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate regular fields
    config.sections.forEach(section => {
      section.fields.forEach(field => {
        const error = validateField(field, formData[field.name]);
        if (error) {
          newErrors[field.name] = error;
        }
      });
    });

    // Validate team members
    const teamErrors = validateTeamMembers();
    Object.assign(newErrors, teamErrors);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: ''
      }));
    }
  };

  const handleTeamMemberChange = (index: number, field: keyof TeamMember, value: any) => {
    setTeamMembers(prev => {
      const newMembers = [...prev];
      newMembers[index] = {
        ...newMembers[index],
        [field]: value
      };
      return newMembers;
    });

    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`team_${index}_${field}`];
      delete newErrors.team;
      return newErrors;
    });
  };

  const addTeamMember = () => {
    if (!config.maxTeamSize || teamMembers.length < config.maxTeamSize) {
      setTeamMembers(prev => [...prev, { 
        name: '', email: '', phone: '', college: '', year: '', role: '', skills: [] 
      }]);
    }
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submissionData = {
      ...formData,
      teamMembers: config.teamRequired ? teamMembers.filter(member => 
        member.name.trim() && member.email.trim()
      ) : undefined
    };

    onSubmit(submissionData);
  };

  const renderField = (field: FormField) => {
    const fieldError = errors[field.name];
    const commonProps = {
      id: field.name,
      name: field.name,
      className: fieldError ? 'border-red-500' : ''
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <Input
            {...commonProps}
            type={field.type === 'phone' ? 'tel' : field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || 0)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );

      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select
            value={formData[field.name] || ''}
            onValueChange={(value) => handleFieldChange(field.name, value)}
          >
            <SelectTrigger className={fieldError ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={formData[field.name] || ''}
            onValueChange={(value) => handleFieldChange(field.name, value)}
            className="space-y-2"
          >
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.name}_${option.value}`} />
                <Label htmlFor={`${field.name}_${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}_${option.value}`}
                  checked={formData[field.name]?.includes(option.value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = formData[field.name] || [];
                    if (checked) {
                      handleFieldChange(field.name, [...currentValues, option.value]);
                    } else {
                      handleFieldChange(field.name, currentValues.filter((v: string) => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${field.name}_${option.value}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded-md">
              {skillOptions.map((skill) => (
                <Badge
                  key={skill}
                  variant={formData[field.name]?.includes(skill) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90 transition-colors"
                  onClick={() => {
                    const currentSkills = formData[field.name] || [];
                    if (currentSkills.includes(skill)) {
                      handleFieldChange(field.name, currentSkills.filter((s: string) => s !== skill));
                    } else {
                      handleFieldChange(field.name, [...currentSkills, skill]);
                    }
                  }}
                >
                  {skill}
                </Badge>
              ))}
            </div>
            {formData[field.name]?.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Selected: {formData[field.name]?.join(', ')}
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            {...commonProps}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  const renderTeamSection = () => {
    if (!config.teamRequired) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users size={20} />
            <span>Team Information</span>
            {config.minTeamSize && config.maxTeamSize && (
              <Badge variant="outline">
                {config.minTeamSize}-{config.maxTeamSize} members
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Add your team members. Each member will receive event updates.
          </p>
          {errors.team && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm">{errors.team}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="border rounded-lg p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Team Member {index + 1}</span>
                  {index === 0 && <Badge variant="secondary">Leader</Badge>}
                </h4>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMember(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus size={16} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`team_${index}_name`}>
                    Name {index === 0 && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`team_${index}_name`}
                    value={member.name}
                    onChange={(e) => handleTeamMemberChange(index, 'name', e.target.value)}
                    placeholder="Enter full name"
                    className={errors[`team_${index}_name`] ? 'border-red-500' : ''}
                  />
                  {errors[`team_${index}_name`] && (
                    <p className="text-sm text-red-600">{errors[`team_${index}_name`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`team_${index}_email`}>
                    Email {index === 0 && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={`team_${index}_email`}
                    type="email"
                    value={member.email}
                    onChange={(e) => handleTeamMemberChange(index, 'email', e.target.value)}
                    placeholder="Enter email address"
                    className={errors[`team_${index}_email`] ? 'border-red-500' : ''}
                  />
                  {errors[`team_${index}_email`] && (
                    <p className="text-sm text-red-600">{errors[`team_${index}_email`]}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`team_${index}_phone`}>Phone</Label>
                  <Input
                    id={`team_${index}_phone`}
                    type="tel"
                    value={member.phone}
                    onChange={(e) => handleTeamMemberChange(index, 'phone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`team_${index}_college`}>College</Label>
                  <Input
                    id={`team_${index}_college`}
                    value={member.college}
                    onChange={(e) => handleTeamMemberChange(index, 'college', e.target.value)}
                    placeholder="Enter college name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`team_${index}_year`}>Year/Level</Label>
                  <Select
                    value={member.year || ''}
                    onValueChange={(value) => handleTeamMemberChange(index, 'year', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`team_${index}_role`}>Role</Label>
                  <Input
                    id={`team_${index}_role`}
                    value={member.role}
                    onChange={(e) => handleTeamMemberChange(index, 'role', e.target.value)}
                    placeholder="e.g., Developer, Designer, PM"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md">
                  {skillOptions.map((skill) => (
                    <Badge
                      key={skill}
                      variant={member.skills?.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90 transition-colors text-xs"
                      onClick={() => {
                        const currentSkills = member.skills || [];
                        if (currentSkills.includes(skill)) {
                          handleTeamMemberChange(index, 'skills', currentSkills.filter(s => s !== skill));
                        } else {
                          handleTeamMemberChange(index, 'skills', [...currentSkills, skill]);
                        }
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}

          {(!config.maxTeamSize || teamMembers.length < config.maxTeamSize) && (
            <Button
              type="button"
              variant="outline"
              onClick={addTeamMember}
              className="w-full"
            >
              <UserPlus size={16} className="mr-2" />
              Add Team Member
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const currentSectionData = config.sections[currentSection];
  const isLastSection = currentSection === config.sections.length - 1;
  const isFirstSection = currentSection === 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Register for {eventTitle}</h2>
        <p className="text-muted-foreground">{config.description}</p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Section {currentSection + 1} of {config.sections.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(((currentSection + 1) / config.sections.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSection + 1) / config.sections.length) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current section */}
        <Card>
          <CardHeader>
            <CardTitle>{currentSectionData.title}</CardTitle>
            {currentSectionData.description && (
              <p className="text-muted-foreground">{currentSectionData.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {currentSectionData.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.name} className="flex items-center space-x-1">
                  <span>{field.label}</span>
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
                {renderField(field)}
                {errors[field.name] && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle size={16} />
                    <span className="text-sm">{errors[field.name]}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team section - show on last section for team events */}
        {isLastSection && renderTeamSection()}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            {!isFirstSection && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentSection(prev => prev - 1)}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-2">
            {!isLastSection ? (
              <Button
                type="button"
                onClick={() => setCurrentSection(prev => prev + 1)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Next Section
              </Button>
            ) : (
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                <CheckCircle size={16} className="mr-2" />
                Submit Registration
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}