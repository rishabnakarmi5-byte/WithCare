import React, { useState, useEffect } from 'react';
import { RecipientType, ToneType, GenerationRequest, VoiceOption, LanguageOption } from '../types';
import { Send, Loader2 } from 'lucide-react';

interface InputFormProps {
  onSubmit: (request: GenerationRequest) => void;
  isLoading: boolean;
  initialData?: GenerationRequest | null;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, initialData }) => {
  const [userInput, setUserInput] = useState('');
  const [recipient, setRecipient] = useState<RecipientType>(RecipientType.PARENT);
  const [tone, setTone] = useState<ToneType>(ToneType.EMPATHETIC);
  const [voice, setVoice] = useState<VoiceOption>(VoiceOption.KORE);
  const [language, setLanguage] = useState<LanguageOption>(LanguageOption.ENGLISH);

  useEffect(() => {
    if (initialData) {
      setUserInput(initialData.userInput);
      setRecipient(initialData.recipient);
      setTone(initialData.tone);
      setVoice(initialData.voice);
      setLanguage(initialData.language);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      onSubmit({ userInput, recipient, tone, voice, language });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          {initialData ? 'Edit your request' : "What's on your mind?"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Text Area */}
          <div>
            <label htmlFor="thought" className="block text-sm font-medium text-slate-700 mb-2">
              Your raw thoughts
            </label>
            <textarea
              id="thought"
              rows={5}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none transition-colors"
              placeholder="e.g., Tell my mom I need personal boundaries because..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Recipient Selector */}
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-slate-700 mb-2">
                Who is this for?
              </label>
              <select
                id="recipient"
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 bg-white"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value as RecipientType)}
                disabled={isLoading}
              >
                {Object.values(RecipientType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Tone Selector */}
            <div>
              <label htmlFor="tone" className="block text-sm font-medium text-slate-700 mb-2">
                Desired Approach
              </label>
              <select
                id="tone"
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 bg-white"
                value={tone}
                onChange={(e) => setTone(e.target.value as ToneType)}
                disabled={isLoading}
              >
                {Object.values(ToneType).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Language Selector */}
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-slate-700 mb-2">
                Language
              </label>
              <select
                id="language"
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 bg-white"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageOption)}
                disabled={isLoading}
              >
                {Object.values(LanguageOption).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Voice Selector */}
            <div>
              <label htmlFor="voice" className="block text-sm font-medium text-slate-700 mb-2">
                Voice for Audio
              </label>
              <select
                id="voice"
                className="block w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-brand-500 focus:border-brand-500 bg-white"
                value={voice}
                onChange={(e) => setVoice(e.target.value as VoiceOption)}
                disabled={isLoading}
              >
                {Object.values(VoiceOption).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="w-full flex items-center justify-center py-4 px-6 rounded-xl text-white font-semibold text-lg bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform transition-all hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                {initialData ? 'Updating Message...' : 'Crafting Message...'}
              </>
            ) : (
              <>
                <Send className="-ml-1 mr-3 h-5 w-5" />
                {initialData ? 'Update Message' : 'Bridge the Gap'}
              </>
            )}
          </button>
        </form>
      </div>
      <div className="bg-slate-50 px-6 py-4 text-center">
        <p className="text-xs text-slate-500">
          Uses Google Search to verify facts and science-back your message.
        </p>
      </div>
    </div>
  );
};

export default InputForm;
