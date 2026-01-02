import React from 'react';
import { HeartHandshake, Sparkles } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <div className="text-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-center items-center mb-4">
        <div className="bg-brand-100 p-3 rounded-full">
          <HeartHandshake className="h-10 w-10 text-brand-600" />
        </div>
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
        Bridge<span className="text-brand-600">The</span>Gap
      </h1>
      <p className="mt-5 max-w-xl mx-auto text-xl text-slate-500">
        Explain the inexplicable. Turn raw feelings into scientifically backed, empathetic messages for the people you care about.
      </p>
      <div className="mt-4 flex justify-center space-x-2 text-sm text-slate-400">
        <span className="flex items-center"><Sparkles className="w-4 h-4 mr-1 text-yellow-500" /> Powered by Gemini</span>
      </div>
    </div>
  );
};

export default Hero;