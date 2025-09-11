import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Eye, 
  Save,
  Settings,
  Users,
  FormInput,
  Type,
  Mail,
  Phone,
  FileText,
  ListFilter,
  CheckSquare,
  Circle,
  Upload
} from 'lucide-react';
import { RegistrationField, RegistrationFormConfig, getDefaultRegistrationConfig } from './EventRegistrationForm';

interface RegistrationFormBuilderProps {
  eventType: string;
  initialConfig?: RegistrationFormConfig;
  onSave: (config: RegistrationFormConfig) => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input', icon: Type },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'textarea', label: 'Long Text', icon: FileText },
  { value: 'select', label: 'Dropdown', icon: ListFilter },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'radio', label: 'Radio Buttons', icon: Circle },
  { value: 'file', label: 'File Upload', icon: Upload }
];

export function RegistrationFormBuilder({ 
  eventType, 
  initialConfig, 
  onSave, 
  onCancel 
}: RegistrationFormBuilderProps) {
  const [config, setConfig] = useState<RegistrationFormConfig>(
    initialConfig || getDefaultRegistrationConfig(eventType)
  );
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const addField = (type: string) => {
    const newField: RegistrationField = {
      id: `field_${Date.now()}`,
      type: type as any,
      label: `New ${type} field`,
      required: false,
      placeholder: type === 'select' || type === 'radio' ? undefined : `Enter ${type}`,
      options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
    };

    setConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    
    setSelectedFieldIndex(config.fields.length);
  };

  const updateField = (index: number, updates: Partial<RegistrationField>) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.map((field, i) => 
        i === index ? { ...field, ...updates } : field
      )
    }));
  };

  const removeField = (index: number) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index)
    }));
    setSelectedFieldIndex(null);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...config.fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    
    setConfig(prev => ({
      ...prev,
      fields: newFields
    }));
  };

  const renderFieldEditor = () => {
    if (selectedFieldIndex === null) return null;
    
    const field = config.fields[selectedFieldIndex];
    if (!field) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Edit Field</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFieldIndex(null)}
            >
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Field Label */}
          <div>
            <Label>Field Label</Label>
            <Input
              value={field.label}
              onChange={(e) => updateField(selectedFieldIndex, { label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>

          {/* Field Type */}
          <div>
            <Label>Field Type</Label>
            <Select
              value={field.type}
              onValueChange={(value) => updateField(selectedFieldIndex, { type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center space-x-2">
                      <type.icon size={16} />
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder */}
          {['text', 'email', 'phone', 'textarea'].includes(field.type) && (
            <div>
              <Label>Placeholder Text</Label>
              <Input
                value={field.placeholder || ''}
                onChange={(e) => updateField(selectedFieldIndex, { placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <Label>Help Text (Optional)</Label>
            <Textarea
              value={field.description || ''}
              onChange={(e) => updateField(selectedFieldIndex, { description: e.target.value })}
              placeholder="Add helpful description for this field"
              rows={2}
            />
          </div>

          {/* Options for select/radio */}
          {(field.type === 'select' || field.type === 'radio') && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {field.options?.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])];
                        newOptions[optionIndex] = e.target.value;
                        updateField(selectedFieldIndex, { options: newOptions });
                      }}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = field.options?.filter((_, i) => i !== optionIndex);
                        updateField(selectedFieldIndex, { options: newOptions });
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`];
                    updateField(selectedFieldIndex, { options: newOptions });
                  }}
                >
                  <Plus size={14} className="mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <Label>Required Field</Label>
            <Switch
              checked={field.required}
              onCheckedChange={(checked) => updateField(selectedFieldIndex, { required: checked })}
            />
          </div>

          {/* Remove field button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeField(selectedFieldIndex)}
            className="w-full"
          >
            <Trash2 size={14} className="mr-2" />
            Remove Field
          </Button>
        </CardContent>
      </Card>
    );
  };

  const getFieldIcon = (type: string) => {
    const fieldType = FIELD_TYPES.find(t => t.value === type);
    return fieldType?.icon || FormInput;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Registration Form Builder</h1>
            <p className="text-muted-foreground">
              Customize the registration form for your {eventType}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? <Edit3 size={16} /> : <Eye size={16} />}
              <span className="ml-2">{isPreviewMode ? 'Edit' : 'Preview'}</span>
            </Button>
            <Button onClick={() => onSave(config)}>
              <Save size={16} className="mr-2" />
              Save Form
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings size={20} className="mr-2" />
                  Form Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Form Title</Label>
                  <Input
                    value={config.title}
                    onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Registration Form Title"
                  />
                </div>
                
                <div>
                  <Label>Form Description</Label>
                  <Textarea
                    value={config.description}
                    onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this form is for"
                    rows={3}
                  />
                </div>

                {/* Team-based settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Team-based Event</Label>
                    <Switch
                      checked={config.teamBased}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, teamBased: checked }))}
                    />
                  </div>

                  {config.teamBased && (
                    <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                      <div>
                        <Label>Minimum Team Size</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.minTeamSize || 1}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            minTeamSize: parseInt(e.target.value) 
                          }))}
                        />
                      </div>
                      
                      <div>
                        <Label>Maximum Team Size</Label>
                        <Input
                          type="number"
                          min="1"
                          value={config.maxTeamSize || 4}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            maxTeamSize: parseInt(e.target.value) 
                          }))}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label>Allow Individual Participation</Label>
                        <Switch
                          checked={config.allowIndividual}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            allowIndividual: checked 
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Add Field Options */}
            <Card>
              <CardHeader>
                <CardTitle>Add Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map(fieldType => (
                    <Button
                      key={fieldType.value}
                      variant="outline"
                      size="sm"
                      onClick={() => addField(fieldType.value)}
                      className="justify-start"
                    >
                      <fieldType.icon size={14} className="mr-2" />
                      {fieldType.label}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Field Editor */}
            {renderFieldEditor()}
          </div>

          {/* Form Preview/Builder */}
          <div className="lg:col-span-2">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Form Fields</CardTitle>
                  <Badge variant="outline">
                    {config.fields.length} field{config.fields.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    <AnimatePresence>
                      {config.fields.map((field, index) => {
                        const FieldIcon = getFieldIcon(field.type);
                        return (
                          <motion.div
                            key={field.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Card 
                              className={`cursor-pointer transition-all duration-200 ${
                                selectedFieldIndex === index 
                                  ? 'border-blue-500 shadow-md' 
                                  : 'hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedFieldIndex(index)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3 flex-1">
                                    <div className="flex items-center space-x-2">
                                      <GripVertical size={16} className="text-gray-400" />
                                      <FieldIcon size={16} className="text-blue-500" />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-medium truncate">{field.label}</h4>
                                        {field.required && (
                                          <Badge variant="destructive" className="text-xs py-0.5 px-1.5">Required</Badge>
                                        )}
                                      </div>
                                      
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Type: {FIELD_TYPES.find(t => t.value === field.type)?.label}
                                      </p>
                                      
                                      {field.description && (
                                        <p className="text-sm text-muted-foreground mt-1 italic">
                                          "{field.description}"
                                        </p>
                                      )}
                                      
                                      {field.options && field.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {field.options.slice(0, 3).map((option, i) => (
                                            <Badge key={i} variant="outline" className="text-xs py-0.5 px-1.5">
                                              {option}
                                            </Badge>
                                          ))}
                                          {field.options.length > 3 && (
                                            <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                                              +{field.options.length - 3} more
                                            </Badge>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeField(index);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    
                    {config.fields.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <FormInput size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No fields added yet</p>
                        <p className="text-sm">Click on field types to add them to your form</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-8">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(config)}>
            <Save size={16} className="mr-2" />
            Save Registration Form
          </Button>
        </div>
      </div>
    </div>
  );
}