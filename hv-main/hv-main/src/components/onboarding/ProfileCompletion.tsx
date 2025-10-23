import { motion } from 'motion/react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { GraduationCap, User, BookOpen, FileText } from 'lucide-react';

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Graduate', 'Alumni'];

const courses = [
  'Computer Science Engineering',
  'Information Technology',
  'Electronics and Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Business Administration',
  'Economics',
  'Physics',
  'Chemistry',
  'Mathematics',
  'English Literature',
  'Arts',
  'Commerce',
  'Other'
];

interface ProfileCompletionProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function ProfileCompletion({ data, onUpdate }: ProfileCompletionProps) {
  const profile = data.profile || {
    college: '',
    year: '',
    course: '',
    bio: ''
  };

  const updateProfile = (field: string, value: string) => {
    onUpdate({
      profile: {
        ...profile,
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Complete your profile to help event organizers understand their audience better and get personalized recommendations.
      </p>

      <div className="space-y-4">
        {/* College */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium mb-2 flex items-center">
            <GraduationCap size={16} className="mr-2" />
            College/University *
          </label>
          <Input
            placeholder="Enter your college name"
            value={profile.college}
            onChange={(e) => updateProfile('college', e.target.value)}
          />
        </motion.div>

        {/* Year */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <label className="block text-sm font-medium mb-2 flex items-center">
            <User size={16} className="mr-2" />
            Academic Year *
          </label>
          <Select onValueChange={(value) => updateProfile('year', value)} value={profile.year}>
            <SelectTrigger>
              <SelectValue placeholder="Select your year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Course */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <label className="block text-sm font-medium mb-2 flex items-center">
            <BookOpen size={16} className="mr-2" />
            Course/Field of Study *
          </label>
          <Select onValueChange={(value) => updateProfile('course', value)} value={profile.course}>
            <SelectTrigger>
              <SelectValue placeholder="Select your course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course} value={course}>
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Bio */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label className="block text-sm font-medium mb-2 flex items-center">
            <FileText size={16} className="mr-2" />
            Bio (Optional)
          </label>
          <Textarea
            placeholder="Tell us a bit about yourself, your interests, or what you're looking for in events..."
            value={profile.bio}
            onChange={(e) => updateProfile('bio', e.target.value)}
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {profile.bio.length}/200 characters
          </p>
        </motion.div>
      </div>

      {/* Preview */}
      {profile.college && profile.year && profile.course && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <h4 className="font-medium mb-2">Profile Preview:</h4>
          <div className="text-sm space-y-1">
            <p><strong>College:</strong> {profile.college}</p>
            <p><strong>Year:</strong> {profile.year}</p>
            <p><strong>Course:</strong> {profile.course}</p>
            {profile.bio && <p><strong>Bio:</strong> {profile.bio}</p>}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Privacy Note:</strong> Your profile information helps us personalize your experience and 
          allows event organizers to better understand their audience demographics. You can update 
          this information anytime in your settings.
        </p>
      </motion.div>
    </div>
  );
}