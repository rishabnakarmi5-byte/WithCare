import React, { useState } from 'react';
import Hero from './components/Hero';
import InputForm from './components/InputForm';
import ResultDisplay from './components/ResultDisplay';
import { generateBridgeMessage, refineMessage } from './services/geminiService';
import { GeneratedContent, GenerationRequest } from './types';

function App() {
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (request: GenerationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const content = await generateBridgeMessage(request);
      setResult(content);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (instruction: string) => {
      if (!result) return;
      setIsRefining(true);
      try {
          const newContent = await refineMessage(result.message, instruction, result.originalRequest);
          // Preserve audio if refining doesn't change much? No, invalidate audio.
          newContent.audioBase64 = undefined; 
          setResult(newContent);
      } catch (err: any) {
          setError(err.message || "Failed to refine.");
      } finally {
          setIsRefining(false);
      }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const handleEditPrompt = () => {
    // We just clear the result but keep the form state (which we will pass down to InputForm via result.originalRequest)
    // Actually, we need to switch view but keep data.
    // If result is null, InputForm shows.
    // So if we set Result to null, we need to pass the "Initial Data" to InputForm.
    // We can just rely on `result` being non-null to show ResultDisplay, 
    // but if we want to edit, we need to temporarily hide ResultDisplay and show InputForm with data.
    // Let's use a state for `editingRequest`.
  };
  
  // We handle the "Edit" flow by setting result to null, but passing the previous result's request data to InputForm.
  // We can derive this: if `result` is null, we are in input mode.
  // We need to know if we are "editing" or "fresh".
  // Let's add a state `draftRequest` which holds the request to be edited.
  const [draftRequest, setDraftRequest] = useState<GenerationRequest | null>(null);

  const onEditTrigger = () => {
      if (result) {
          setDraftRequest(result.originalRequest);
          setResult(null);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Hero />
        
        <main className="transition-all duration-500 ease-in-out">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!result ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <InputForm 
                onSubmit={handleGenerate} 
                isLoading={isLoading} 
                initialData={draftRequest}
              />
              
              {/* Feature Grid */}
              <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white mx-auto mb-4 shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Scientifically Backed</h3>
                  <p className="mt-2 text-base text-slate-500">We verify claims with real sources to add weight to your words.</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white mx-auto mb-4 shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Deep Empathy</h3>
                  <p className="mt-2 text-base text-slate-500">Tone matters. We translate frustration into care and understanding.</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-500 text-white mx-auto mb-4 shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">Share Instantly</h3>
                  <p className="mt-2 text-base text-slate-500">Send via WhatsApp or Messenger with a single tap.</p>
                </div>
              </div>
            </div>
          ) : (
            <ResultDisplay 
                content={result} 
                onReset={() => { handleReset(); setDraftRequest(null); }} 
                onEditPrompt={onEditTrigger}
                onRefine={handleRefine}
                isRefining={isRefining}
            />
          )}
        </main>
      </div>
      
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} BridgeTheGap. Built with Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
