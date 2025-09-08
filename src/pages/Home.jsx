import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Clock,
  Globe,
  Sparkles,
  Zap,
  Brain,
  Rocket
} from 'lucide-react';

const Home = () => {
  const AnimatedCounter = ({ end, duration = 2 }) => {
    const ref = useRef();
    const [count, setCount] = React.useState(0);

    useEffect(() => {
      let startTime;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
    }, [end, duration]);

    return <span ref={ref}>{count.toLocaleString()}</span>;
  };

  return (
    <div className="min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-purple-100/20 to-pink-100/20 animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <div className="mb-8 animate-fade-in">
            <div className="inline-block mb-6">
              <Sparkles className="h-16 w-16 text-blue-500 mx-auto animate-spin-slow" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              Find Your Dream Job
              <span className="block text-4xl md:text-6xl mt-2">
                With AI-Powered Precision
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
              Join the future of job searching with our revolutionary AI platform that connects 
              talented professionals with their perfect career opportunities.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link
              to="/register"
              className="group relative overflow-hidden px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            >
              <span className="relative z-10 flex items-center">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </Link>
            
            <Link
              to="/jobs"
              className="group px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-gray-800 rounded-xl font-semibold text-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-white/20"
            >
              <span className="flex items-center">
                <Search className="mr-2 h-5 w-5" />
                Browse Jobs
              </span>
            </Link>
          </div>

          {/* Floating Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            {[
              { number: 50000, label: "Active Jobs", icon: Briefcase },
              { number: 100000, label: "Happy Users", icon: Users },
              { number: 95, label: "Success Rate", icon: TrendingUp, suffix: "%" }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <stat.icon className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  <AnimatedCounter end={stat.number} />
                  {stat.suffix}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-blue-500 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose JobHub?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the next generation of job searching with cutting-edge AI technology 
              and unparalleled user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Brain className="h-8 w-8 text-blue-600" />,
                title: "AI-Powered Matching",
                description: "Advanced machine learning algorithms match you with perfect job opportunities based on your skills and preferences",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Rocket className="h-8 w-8 text-emerald-600" />,
                title: "Career Acceleration",
                description: "Track your progress and get personalized career recommendations to fast-track your professional growth",
                gradient: "from-emerald-500 to-teal-500"
              },
              {
                icon: <Zap className="h-8 w-8 text-orange-600" />,
                title: "Real-time Updates",
                description: "Get instant notifications for new jobs, application updates, and messages with our lightning-fast system",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: <Globe className="h-8 w-8 text-purple-600" />,
                title: "Global Opportunities",
                description: "Access thousands of remote and hybrid job opportunities from top companies worldwide",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 h-full group hover:bg-white/15 transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in three simple steps with our intelligent platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Your AI Profile",
                description: "Build your intelligent profile with skills, experience, and preferences. Our AI learns your career aspirations.",
                color: "blue"
              },
              {
                step: "02", 
                title: "Get AI-Matched",
                description: "Our advanced algorithms analyze thousands of jobs and match you with opportunities that fit perfectly.",
                color: "emerald"
              },
              {
                step: "03",
                title: "Apply & Connect",
                description: "Apply with one click and connect directly with recruiters through our real-time messaging system.",
                color: "purple"
              }
            ].map((step, index) => (
              <div
                key={index}
                className="text-center relative"
              >
                <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 relative overflow-hidden hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className={`w-20 h-20 rounded-full bg-gradient-to-r from-${step.color}-500 to-${step.color}-600 flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-2xl hover:scale-110 transition-transform duration-300`}>
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                  
                  {/* Connecting Line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands of satisfied professionals who found their dream careers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Senior Software Engineer",
                company: "TechCorp",
                content: "JobHub's AI matching is incredible! I found my dream job in just 2 weeks. The recommendations were spot-on.",
                rating: 5,
                avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
              },
              {
                name: "Michael Chen",
                role: "Hiring Manager",
                company: "StartupXYZ",
                content: "As a recruiter, I love how easy it is to find qualified candidates. The platform's intelligence is unmatched.",
                rating: 5,
                avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
              },
              {
                name: "Emily Davis",
                role: "Marketing Director",
                company: "BrandCo",
                content: "The real-time messaging and seamless application process made my job search effortless. Highly recommended!",
                rating: 5,
                avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 h-full hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full object-cover mr-4 hover:scale-110 transition-transform duration-300"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-16 relative overflow-hidden hover:bg-white/15 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 animate-gradient" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Ready to Transform Your Career?
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Join our revolutionary AI-powered platform today and discover opportunities 
                that perfectly match your skills and aspirations.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link
                  to="/register"
                  className="group relative overflow-hidden px-10 py-5 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold text-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <span className="relative z-10 flex items-center">
                    Start Your Journey
                    <Rocket className="ml-2 h-5 w-5" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
                
                <Link
                  to="/login"
                  className="px-10 py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-gray-800 rounded-xl font-semibold text-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-white/20"
                >
                  <span className="flex items-center">
                    Sign In
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;