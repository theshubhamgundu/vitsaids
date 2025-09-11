import { RegistrationFormConfig, FormField, FormSection } from './DynamicRegistrationForm';

export const getHackathonRegistrationConfig = (): RegistrationFormConfig => ({
  title: 'Hackathon Registration',
  description: 'Join us for an exciting coding marathon! Please fill out all required information.',
  teamRequired: true,
  minTeamSize: 2,
  maxTeamSize: 4,
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      fields: [
        {
          id: 'fullName',
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name',
          validation: { minLength: 2, maxLength: 100 }
        },
        {
          id: 'email',
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'your.email@example.com',
          validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
        },
        {
          id: 'phone',
          name: 'phone',
          label: 'Phone Number',
          type: 'phone',
          required: true,
          placeholder: '+1 (555) 123-4567'
        },
        {
          id: 'college',
          name: 'college',
          label: 'College/University',
          type: 'text',
          required: true,
          placeholder: 'Enter your institution name'
        },
        {
          id: 'year',
          name: 'year',
          label: 'Academic Year',
          type: 'select',
          required: true,
          options: [
            { value: '1st', label: '1st Year' },
            { value: '2nd', label: '2nd Year' },
            { value: '3rd', label: '3rd Year' },
            { value: '4th', label: '4th Year' },
            { value: 'graduate', label: 'Graduate' },
            { value: 'phd', label: 'PhD' }
          ]
        }
      ]
    },
    {
      id: 'experience',
      title: 'Technical Background',
      description: 'Help us understand your technical skills and experience',
      fields: [
        {
          id: 'programmingExperience',
          name: 'programmingExperience',
          label: 'Programming Experience',
          type: 'select',
          required: true,
          options: [
            { value: 'beginner', label: 'Beginner (0-1 years)' },
            { value: 'intermediate', label: 'Intermediate (1-3 years)' },
            { value: 'advanced', label: 'Advanced (3-5 years)' },
            { value: 'expert', label: 'Expert (5+ years)' }
          ]
        },
        {
          id: 'primarySkills',
          name: 'primarySkills',
          label: 'Primary Technical Skills',
          type: 'skills',
          required: true,
          description: 'Select your main technical skills (choose at least 3)'
        },
        {
          id: 'favoriteLanguages',
          name: 'favoriteLanguages',
          label: 'Favorite Programming Languages',
          type: 'checkbox',
          required: false,
          options: [
            { value: 'javascript', label: 'JavaScript' },
            { value: 'python', label: 'Python' },
            { value: 'java', label: 'Java' },
            { value: 'cpp', label: 'C++' },
            { value: 'csharp', label: 'C#' },
            { value: 'go', label: 'Go' },
            { value: 'rust', label: 'Rust' },
            { value: 'swift', label: 'Swift' },
            { value: 'kotlin', label: 'Kotlin' },
            { value: 'typescript', label: 'TypeScript' }
          ]
        },
        {
          id: 'previousHackathons',
          name: 'previousHackathons',
          label: 'Previous Hackathon Experience',
          type: 'number',
          required: false,
          placeholder: '0',
          validation: { min: 0, max: 50 },
          description: 'How many hackathons have you participated in?'
        },
        {
          id: 'githubProfile',
          name: 'githubProfile',
          label: 'GitHub Profile (Optional)',
          type: 'text',
          required: false,
          placeholder: 'https://github.com/yourusername'
        },
        {
          id: 'portfolio',
          name: 'portfolio',
          label: 'Portfolio Website (Optional)',
          type: 'text',
          required: false,
          placeholder: 'https://yourportfolio.com'
        }
      ]
    },
    {
      id: 'project',
      title: 'Project Preferences',
      description: 'Tell us about your interests and what you hope to build',
      fields: [
        {
          id: 'projectInterests',
          name: 'projectInterests',
          label: 'Areas of Interest',
          type: 'checkbox',
          required: true,
          description: 'What types of projects interest you? (Select at least 2)',
          options: [
            { value: 'web', label: 'Web Applications' },
            { value: 'mobile', label: 'Mobile Apps' },
            { value: 'ai-ml', label: 'AI/Machine Learning' },
            { value: 'blockchain', label: 'Blockchain' },
            { value: 'iot', label: 'Internet of Things (IoT)' },
            { value: 'ar-vr', label: 'AR/VR' },
            { value: 'games', label: 'Game Development' },
            { value: 'fintech', label: 'FinTech' },
            { value: 'healthtech', label: 'HealthTech' },
            { value: 'edtech', label: 'EdTech' },
            { value: 'social-impact', label: 'Social Impact' },
            { value: 'devtools', label: 'Developer Tools' }
          ]
        },
        {
          id: 'preferredRole',
          name: 'preferredRole',
          label: 'Preferred Role in Team',
          type: 'radio',
          required: true,
          options: [
            { value: 'frontend', label: 'Frontend Developer' },
            { value: 'backend', label: 'Backend Developer' },
            { value: 'fullstack', label: 'Full-Stack Developer' },
            { value: 'mobile', label: 'Mobile Developer' },
            { value: 'designer', label: 'UI/UX Designer' },
            { value: 'data', label: 'Data Scientist/Analyst' },
            { value: 'pm', label: 'Project Manager' },
            { value: 'devops', label: 'DevOps/Infrastructure' }
          ]
        },
        {
          id: 'problemStatement',
          name: 'problemStatement',
          label: 'Problem You Want to Solve',
          type: 'textarea',
          required: false,
          placeholder: 'Describe a problem you are passionate about solving...',
          description: 'Optional: Share what problem you hope to tackle during the hackathon',
          validation: { maxLength: 500 }
        }
      ]
    },
    {
      id: 'logistics',
      title: 'Event Logistics',
      description: 'Help us plan for your participation',
      fields: [
        {
          id: 'dietaryRestrictions',
          name: 'dietaryRestrictions',
          label: 'Dietary Restrictions/Preferences',
          type: 'checkbox',
          required: false,
          options: [
            { value: 'vegetarian', label: 'Vegetarian' },
            { value: 'vegan', label: 'Vegan' },
            { value: 'gluten-free', label: 'Gluten-free' },
            { value: 'halal', label: 'Halal' },
            { value: 'kosher', label: 'Kosher' },
            { value: 'lactose-intolerant', label: 'Lactose Intolerant' },
            { value: 'nut-allergy', label: 'Nut Allergy' }
          ]
        },
        {
          id: 'tshirtSize',
          name: 'tshirtSize',
          label: 'T-Shirt Size',
          type: 'select',
          required: true,
          options: [
            { value: 'xs', label: 'XS' },
            { value: 's', label: 'S' },
            { value: 'm', label: 'M' },
            { value: 'l', label: 'L' },
            { value: 'xl', label: 'XL' },
            { value: 'xxl', label: 'XXL' }
          ]
        },
        {
          id: 'emergencyContact',
          name: 'emergencyContact',
          label: 'Emergency Contact',
          type: 'text',
          required: true,
          placeholder: 'Name and phone number'
        },
        {
          id: 'specialNeeds',
          name: 'specialNeeds',
          label: 'Special Accommodations',
          type: 'textarea',
          required: false,
          placeholder: 'Let us know if you need any special accommodations...',
          description: 'Any accessibility requirements or special needs we should know about?',
          validation: { maxLength: 300 }
        },
        {
          id: 'howDidYouHear',
          name: 'howDidYouHear',
          label: 'How did you hear about this event?',
          type: 'select',
          required: false,
          options: [
            { value: 'social-media', label: 'Social Media' },
            { value: 'friend', label: 'Friend/Word of Mouth' },
            { value: 'college', label: 'College/University' },
            { value: 'website', label: 'Website' },
            { value: 'newsletter', label: 'Newsletter' },
            { value: 'event-platform', label: 'Event Platform' },
            { value: 'other', label: 'Other' }
          ]
        }
      ]
    }
  ]
});

export const getIdeathonRegistrationConfig = (): RegistrationFormConfig => ({
  title: 'Ideathon Registration',
  description: 'Join us to brainstorm innovative solutions! Team collaboration is encouraged.',
  teamRequired: true,
  minTeamSize: 2,
  maxTeamSize: 5,
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Tell us about yourself',
      fields: [
        {
          id: 'fullName',
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'your.email@example.com'
        },
        {
          id: 'phone',
          name: 'phone',
          label: 'Phone Number',
          type: 'phone',
          required: true
        },
        {
          id: 'college',
          name: 'college',
          label: 'College/University',
          type: 'text',
          required: true
        },
        {
          id: 'fieldOfStudy',
          name: 'fieldOfStudy',
          label: 'Field of Study',
          type: 'text',
          required: true,
          placeholder: 'e.g., Computer Science, Business, Design'
        }
      ]
    },
    {
      id: 'background',
      title: 'Background & Interests',
      description: 'Help us understand your perspective and interests',
      fields: [
        {
          id: 'areasOfInterest',
          name: 'areasOfInterest',
          label: 'Areas of Interest',
          type: 'checkbox',
          required: true,
          description: 'What domains are you passionate about?',
          options: [
            { value: 'technology', label: 'Technology & Innovation' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'education', label: 'Education' },
            { value: 'environment', label: 'Environment & Sustainability' },
            { value: 'finance', label: 'Finance & Economics' },
            { value: 'social-impact', label: 'Social Impact' },
            { value: 'entertainment', label: 'Entertainment & Media' },
            { value: 'agriculture', label: 'Agriculture' },
            { value: 'transportation', label: 'Transportation' },
            { value: 'smart-cities', label: 'Smart Cities' }
          ]
        },
        {
          id: 'role',
          name: 'role',
          label: 'Your Primary Role/Expertise',
          type: 'radio',
          required: true,
          options: [
            { value: 'business', label: 'Business Strategy' },
            { value: 'design', label: 'Design & User Experience' },
            { value: 'technology', label: 'Technology & Development' },
            { value: 'marketing', label: 'Marketing & Communication' },
            { value: 'research', label: 'Research & Analysis' },
            { value: 'domain-expert', label: 'Domain Expert' },
            { value: 'other', label: 'Other' }
          ]
        },
        {
          id: 'previousExperience',
          name: 'previousExperience',
          label: 'Previous Innovation/Competition Experience',
          type: 'textarea',
          required: false,
          placeholder: 'Describe any previous experience with ideathons, hackathons, or innovation competitions...',
          validation: { maxLength: 400 }
        }
      ]
    },
    {
      id: 'motivation',
      title: 'Goals & Motivation',
      description: 'What are you hoping to achieve?',
      fields: [
        {
          id: 'motivation',
          name: 'motivation',
          label: 'Why do you want to participate?',
          type: 'textarea',
          required: true,
          placeholder: 'Share your motivation for joining this ideathon...',
          validation: { minLength: 50, maxLength: 500 }
        },
        {
          id: 'problemToSolve',
          name: 'problemToSolve',
          label: 'A Problem You Care About',
          type: 'textarea',
          required: false,
          placeholder: 'Describe a problem you are passionate about solving...',
          description: 'Optional: What problem would you like to work on during the ideathon?',
          validation: { maxLength: 400 }
        },
        {
          id: 'expectedOutcome',
          name: 'expectedOutcome',
          label: 'What do you hope to achieve?',
          type: 'checkbox',
          required: true,
          options: [
            { value: 'networking', label: 'Networking with like-minded people' },
            { value: 'learning', label: 'Learning new skills and approaches' },
            { value: 'solution', label: 'Developing a viable solution' },
            { value: 'startup', label: 'Starting a new venture' },
            { value: 'portfolio', label: 'Building portfolio/experience' },
            { value: 'impact', label: 'Creating social impact' },
            { value: 'fun', label: 'Having fun and exploring creativity' }
          ]
        }
      ]
    }
  ]
});

export const getWorkshopRegistrationConfig = (): RegistrationFormConfig => ({
  title: 'Workshop Registration',
  description: 'Join our hands-on learning experience. Individual registration.',
  teamRequired: false,
  sections: [
    {
      id: 'personal',
      title: 'Personal Information',
      description: 'Basic information about yourself',
      fields: [
        {
          id: 'fullName',
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name'
        },
        {
          id: 'email',
          name: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'your.email@example.com'
        },
        {
          id: 'phone',
          name: 'phone',
          label: 'Phone Number',
          type: 'phone',
          required: true
        },
        {
          id: 'organization',
          name: 'organization',
          label: 'Organization/College',
          type: 'text',
          required: true,
          placeholder: 'Enter your organization or college'
        },
        {
          id: 'position',
          name: 'position',
          label: 'Position/Year',
          type: 'text',
          required: true,
          placeholder: 'e.g., Student - 3rd Year, Software Engineer, etc.'
        }
      ]
    },
    {
      id: 'experience',
      title: 'Experience Level',
      description: 'Help us tailor the workshop content to your level',
      fields: [
        {
          id: 'experienceLevel',
          name: 'experienceLevel',
          label: 'Your Experience Level',
          type: 'radio',
          required: true,
          options: [
            { value: 'beginner', label: 'Beginner - New to this topic' },
            { value: 'some-experience', label: 'Some Experience - Basic knowledge' },
            { value: 'intermediate', label: 'Intermediate - Comfortable with basics' },
            { value: 'advanced', label: 'Advanced - Looking to deepen knowledge' }
          ]
        },
        {
          id: 'relevantSkills',
          name: 'relevantSkills',
          label: 'Relevant Skills',
          type: 'skills',
          required: false,
          description: 'Select any relevant skills you currently have'
        },
        {
          id: 'learningGoals',
          name: 'learningGoals',
          label: 'What do you hope to learn?',
          type: 'textarea',
          required: true,
          placeholder: 'Describe what you hope to gain from this workshop...',
          validation: { minLength: 30, maxLength: 400 }
        }
      ]
    },
    {
      id: 'logistics',
      title: 'Workshop Logistics',
      description: 'Help us prepare for your attendance',
      fields: [
        {
          id: 'laptop',
          name: 'laptop',
          label: 'Will you bring a laptop?',
          type: 'radio',
          required: true,
          description: 'Some workshops require hands-on practice',
          options: [
            { value: 'yes', label: 'Yes, I will bring my laptop' },
            { value: 'no', label: 'No, I need a laptop provided' },
            { value: 'not-needed', label: 'Not applicable for this workshop' }
          ]
        },
        {
          id: 'specialRequirements',
          name: 'specialRequirements',
          label: 'Special Requirements',
          type: 'textarea',
          required: false,
          placeholder: 'Any special accommodations or requirements...',
          validation: { maxLength: 200 }
        }
      ]
    }
  ]
});

export const getDefaultRegistrationConfig = (eventType: string): RegistrationFormConfig => {
  switch (eventType) {
    case 'hackathon':
      return getHackathonRegistrationConfig();
    case 'ideathon':
      return getIdeathonRegistrationConfig();
    case 'workshop':
      return getWorkshopRegistrationConfig();
    default:
      return {
        title: 'Event Registration',
        description: 'Please fill out the registration form to join this event.',
        teamRequired: false,
        sections: [
          {
            id: 'basic',
            title: 'Basic Information',
            fields: [
              {
                id: 'fullName',
                name: 'fullName',
                label: 'Full Name',
                type: 'text',
                required: true,
                placeholder: 'Enter your full name'
              },
              {
                id: 'email',
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
                placeholder: 'your.email@example.com'
              },
              {
                id: 'phone',
                name: 'phone',
                label: 'Phone Number',
                type: 'phone',
                required: true
              }
            ]
          }
        ]
      };
  }
};