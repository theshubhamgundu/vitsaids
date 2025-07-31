
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, Database, TrendingUp, Users, Award, Globe } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: Brain,
      title: 'Advanced AI Research',
      description: 'Cutting-edge research in machine learning, deep learning, and neural networks',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Database,
      title: 'Big Data Analytics',
      description: 'Comprehensive data science programs covering analytics, visualization, and insights',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Industry Partnerships',
      description: 'Strong connections with leading tech companies for internships and placements',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: Users,
      title: 'Expert Faculty',
      description: 'World-class faculty with extensive research and industry experience',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Award,
      title: 'Excellence in Education',
      description: 'Recognized programs with high academic standards and innovative curriculum',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: Globe,
      title: 'Global Opportunities',
      description: 'International collaborations and exchange programs with top universities',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            About Our Department
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            We are dedicated to advancing the frontiers of Artificial Intelligence and Data Science through 
            innovative research, quality education, and industry collaboration.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white text-center">
          <h3 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h3>
          <p className="text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto opacity-90">
            To shape the next generation of Artificial Intelligence and Data Science professionals through innovative education, 
            groundbreaking research, and meaningful industry partnerships that drive technological advancement 
            and societal impact.
          </p>
        </div>
      </div>
    </section>
  );
};

export default About;
