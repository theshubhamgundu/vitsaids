import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { InterestSelection } from './InterestSelection';
import { LocationPreferences } from './LocationPreferences';
import { TimeAvailability } from './TimeAvailability';
import { ProfileCompletion } from './ProfileCompletion';
import { NavigationHeader } from '../NavigationHeader';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const steps = [
  { id: 'interests', title: 'Your Interests', component: InterestSelection },
  { id: 'location', title: 'Location Preferences', component: LocationPreferences },
  { id: 'time', title: 'Time Availability', component: TimeAvailability },
  { id: 'profile', title: 'Complete Profile', component: ProfileCompletion }
];

export function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    interests: [],
    preferredColleges: [],
    timePreferences: {
      weekdays: false,
      weekends: false,
      morning: false,
      afternoon: false,
      evening: false
    },
    profile: {
      college: '',
      year: '',
      course: '',
      bio: ''
    }
  });
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const progress = ((currentStep + 1) / steps.length) * 100;
  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      try {
        // Update user profile via AuthContext so state is refreshed immediately
        await updateUser({
          isOnboarded: true,
          interests: formData.interests,
          college: formData.profile.college,
          year: formData.profile.year,
          location: formData.preferredColleges[0] || '',
          updatedAt: new Date().toISOString(),
        });
        const userType = user?.type || 'student';
        navigate(`/${userType}-dashboard`);
      } catch (error) {
        console.error('Error completing onboarding:', error);
        const userType = user?.type || 'student';
        navigate(`/${userType}-dashboard`);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (stepData: any) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const isStepValid = () => {
    // For organizers, allow simple flow without student-specific fields
    if (user?.type === 'organizer') return true;
    switch (currentStep) {
      case 0:
        return formData.interests.length > 0;
      case 1:
        return formData.preferredColleges.length > 0;
      case 2:
        return Object.values(formData.timePreferences).some(Boolean);
      case 3:
        return formData.profile.college && formData.profile.year && formData.profile.course;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Let's set up your profile
            </h1>
            <p className="text-muted-foreground">
              Help us personalize your event discovery experience
            </p>
          </motion.div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className="flex flex-col items-center space-y-2"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs text-center text-muted-foreground max-w-20">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <motion.div
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-8"
            layout
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-semibold mb-6">{steps[currentStep].title}</h2>
                <CurrentStepComponent
                  data={formData}
                  onUpdate={updateFormData}
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="flex items-center"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center"
              >
                {currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}