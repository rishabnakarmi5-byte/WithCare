import React, { useState, useRef } from 'react';
import { GeneratedContent } from '../types';
import { Copy, Check, ExternalLink, Play, Square, Share2, MessageCircle, Edit2, RefreshCw, Upload, Download } from 'lucide-react';
import { generateSpeech, playAudioFromBase64 } from '../services/geminiService';

interface ResultDisplayProps {
  content: GeneratedContent;
  onReset: () => void;
  onEditPrompt: () => void;
  onRefine: (instruction: string) => Promise<void>;
  isRefining: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ content, onReset, onEditPrompt, onRefine, isRefining }) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [showRefineInput, setShowRefineInput] = useState(false);
  
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(content.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(content.message);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareMessenger = () => {
      if (navigator.share) {
          navigator.share({
              title: 'A Message for You',
              text: content.message,
          }).catch(console.error);
      } else {
          handleCopy();
          alert('Message copied! Open Messenger and paste it.');
      }
  };

  const createWavBlob = (base64Data: string): Blob => {
    const binaryString = atob(base64Data);
    const dataLength = binaryString.length;
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);

    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF identifier
    writeString(0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + dataLength, true);
    // RIFF type
    writeString(8, 'WAVE');
    // format chunk identifier
    writeString(12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, 24000, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, 24000 * 2, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(36, 'data');
    // data chunk length
    view.setUint32(40, dataLength, true);

    // write the PCM data
    const bytes = new Uint8Array(buffer, 44);
    for (let i = 0; i < dataLength; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const downloadAudio = (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "bridge_message.wav";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleShareAudio = async () => {
    if (!content.audioBase64) {
        alert("Please listen to the audio first to generate it.");
        return;
    }

    try {
        const blob = createWavBlob(content.audioBase64);
        const file = new File([blob], "bridge_message.wav", { type: "audio/wav" });
        
        // Try sharing if supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
             try {
                await navigator.share({
                    files: [file],
                    title: 'BridgeTheGap Audio Message',
                    text: 'Here is an audio message for you.'
                });
             } catch (shareError) {
                 // User cancelled or share failed - fallback to download
                 console.warn("Share failed or cancelled, falling back to download", shareError);
                 downloadAudio(blob);
             }
        } else {
             // Fallback for desktop or unsupported browsers
             downloadAudio(blob);
        }
    } catch (e) {
        console.error(e);
        alert("Could not process audio for sharing.");
    }
  };

  const toggleAudio = async () => {
    if (isPlaying) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
      }
      setIsPlaying(false);
      return;
    }

    setIsAudioLoading(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      
      const ctx = audioContextRef.current;
      
      let audioBase64 = content.audioBase64;
      if (!audioBase64) {
        // Use the voice from original request
        audioBase64 = await generateSpeech(content.message, content.originalRequest.voice);
        content.audioBase64 = audioBase64; 
      }

      if (ctx && audioBase64) {
         const source = await playAudioFromBase64(audioBase64, ctx);
         audioSourceRef.current = source;
         setIsPlaying(true);
         
         source.onended = () => {
             setIsPlaying(false);
             audioSourceRef.current = null;
         };
      }

    } catch (err) {
      console.error(err);
      alert('Failed to play audio.');
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleRefineSubmit = async () => {
      if (!refineInput.trim()) return;
      await onRefine(refineInput);
      setRefineInput('');
      setShowRefineInput(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-brand-50 px-6 py-4 border-b border-brand-100 flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-brand-800 font-semibold flex items-center">
          <Share2 className="w-4 h-4 mr-2" />
          Generated Message
        </h3>
        <div className="flex gap-2">
            <button onClick={onEditPrompt} className="flex items-center text-xs bg-white border border-brand-200 text-brand-700 px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors">
                <Edit2 className="w-3 h-3 mr-1" /> Edit Request
            </button>
            <button onClick={onReset} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
            Start Over
            </button>
        </div>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {/* Main Message */}
        <div className="relative group">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm text-slate-700 leading-relaxed text-lg whitespace-pre-wrap">
            {content.message}
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-2 bg-white rounded-full shadow-md text-slate-500 hover:text-brand-600 border border-slate-200"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Refinement Section */}
        {showRefineInput ? (
             <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                 <label className="block text-sm font-medium text-slate-700 mb-2">How should we improve this message?</label>
                 <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={refineInput}
                        onChange={(e) => setRefineInput(e.target.value)}
                        placeholder="e.g. Make it shorter, Add more focus on my health..."
                        className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:ring-1 focus:ring-brand-500 outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleRefineSubmit()}
                     />
                     <button 
                        onClick={handleRefineSubmit}
                        disabled={isRefining || !refineInput.trim()}
                        className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700 disabled:opacity-50 text-sm font-medium"
                     >
                         {isRefining ? 'Refining...' : 'Refine'}
                     </button>
                 </div>
             </div>
        ) : (
             <div className="flex justify-start">
                 <button 
                    onClick={() => setShowRefineInput(true)}
                    className="text-sm text-brand-600 hover:text-brand-800 flex items-center font-medium"
                 >
                     <RefreshCw className="w-3 h-3 mr-1" /> Refine this message
                 </button>
             </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
                onClick={toggleAudio}
                className={`col-span-2 sm:col-span-1 flex items-center justify-center px-4 py-3 rounded-lg border font-medium transition-colors ${
                    isPlaying 
                    ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
            >
                {isAudioLoading ? (
                    <span className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full mr-2"></span>
                ) : isPlaying ? (
                    <Square className="w-5 h-5 mr-2 fill-current" />
                ) : (
                    <Play className="w-5 h-5 mr-2 fill-current" />
                )}
                {isPlaying ? 'Stop' : 'Listen'}
            </button>

            <button
                onClick={handleShareAudio}
                className="col-span-2 sm:col-span-1 flex items-center justify-center px-4 py-3 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors font-medium shadow-sm"
            >
                {/* Dynamically show icon based on whether it likely shares or downloads */}
                {navigator.share && navigator.canShare ? <Upload className="w-5 h-5 mr-2" /> : <Download className="w-5 h-5 mr-2" />}
                Share/Save Audio
            </button>

            <button
                onClick={handleShareWhatsApp}
                className="col-span-1 sm:col-span-1 flex items-center justify-center px-4 py-3 rounded-lg bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors font-medium shadow-sm"
            >
                <MessageCircle className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
                onClick={handleShareMessenger}
                className="col-span-1 sm:col-span-1 flex items-center justify-center px-4 py-3 rounded-lg bg-[#0084FF] text-white hover:bg-[#006bcf] transition-colors font-medium shadow-sm"
            >
                <Share2 className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Msg</span>
            </button>
        </div>

        {/* Citations/Grounding */}
        {content.sources.length > 0 && (
          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Scientific Basis & Sources
            </h4>
            <div className="grid gap-2">
              {content.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-3 rounded-lg bg-slate-50 hover:bg-brand-50 transition-colors group border border-slate-100 hover:border-brand-200"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-brand-500 mr-3 flex-shrink-0" />
                  <span className="text-sm text-slate-600 group-hover:text-brand-700 truncate">
                    {source.title}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
