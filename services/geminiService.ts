import { GoogleGenAI, Modality } from "@google/genai";
import { GeneratedContent, GenerationRequest, LanguageOption, VoiceOption } from "../types";

// Initialize Gemini Client
// @ts-ignore
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

const modelIdText = 'gemini-3-pro-preview';
const modelIdSpeech = 'gemini-2.5-flash-preview-tts';

/**
 * Helper to construct the system instruction based on language
 */
const getLanguageInstruction = (lang: LanguageOption): string => {
  switch (lang) {
    case LanguageOption.NEPALI_SCRIPT:
      return "Output the final message primarily in Nepali language using Devanagari script.";
    case LanguageOption.NEPALI_ROMANIZED:
      return "Output the final message in Nepali language but write it using English/Roman characters (Romanized Nepali).";
    case LanguageOption.THAI:
      return "Output the final message in Thai language.";
    default:
      return "Output the message in English.";
  }
};

/**
 * Generates the text message with scientific grounding.
 */
export const generateBridgeMessage = async (request: GenerationRequest): Promise<GeneratedContent> => {
  const langInstruction = getLanguageInstruction(request.language);

  const prompt = `
    You are an expert communication coach, scientist, and mediator. 
    The user is struggling to explain a concept, feeling, or need to a specific recipient.
    
    User's Raw Thought: "${request.userInput}"
    Target Recipient: ${request.recipient}
    Desired Tone: ${request.tone}
    Target Language: ${request.language}

    Task:
    1. Draft a message (written in the first person "I") that the user can send to the recipient.
    2. The message MUST be empathetic, loving, and supportive.
    3. TONE: Make it conversational, authentic, and grounded. Do NOT use overly poetic, flowery, or formal language. It should sound like a real person talking naturally, just more articulate.
    4. LENGTH: Keep it concise and to the point. Only expand when explaining the scientific/psychological backing.
    5. CRITICAL: Integrate scientific backing, psychological concepts, or sociological research to validate the user's feelings or stance. Explain *why* this is valid using facts (e.g., dopamine in gaming, psychological need for boundaries).
    6. ${langInstruction}

    Output Format:
    Return ONLY the drafted message text. Do not add intro/outro.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelIdText,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a specialized app helping bridge communication gaps with science and empathy.",
      },
    });

    const messageText = response.text || "I couldn't generate a message at this time.";
    
    // Extract sources
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return {
      message: messageText,
      sources: uniqueSources,
      originalRequest: request
    };

  } catch (error) {
    console.error("Error generating text:", error);
    throw new Error("Failed to process your request. Please try again.");
  }
};

/**
 * Refines an existing message based on user instruction
 */
export const refineMessage = async (currentMessage: string, refinementInstruction: string, originalRequest: GenerationRequest): Promise<GeneratedContent> => {
  const langInstruction = getLanguageInstruction(originalRequest.language);

  const prompt = `
    You are refining a previously generated message.
    
    Original Message: "${currentMessage}"
    User's Refinement Instruction: "${refinementInstruction}"
    
    Context:
    Recipient: ${originalRequest.recipient}
    Tone: ${originalRequest.tone}
    
    Task:
    Rewrite the message applying the user's refinement instruction.
    Maintain the scientific backing but keep the tone conversational, authentic, and concise (unless asked to expand). 
    Avoid formal or poetic language.
    ${langInstruction}
    
    Output ONLY the new message.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelIdText,
      contents: prompt,
      config: {
        // We keep search enabled in case refinement needs new facts, though less likely
        tools: [{ googleSearch: {} }], 
      },
    });

    const messageText = response.text || currentMessage;
    
    // We try to preserve original sources if new ones aren't found
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return {
      message: messageText,
      sources: uniqueSources,
      originalRequest: originalRequest
    };
  } catch (error) {
    throw new Error("Failed to refine message.");
  }
};

/**
 * Generates audio speech from the text using specific voice
 */
export const generateSpeech = async (text: string, voiceOption: VoiceOption): Promise<string> => {
  // Extract the voice name from the enum string (e.g., "Kore (Calm Female)" -> "Kore")
  const voiceName = voiceOption.split(' ')[0]; 

  try {
    const response = await ai.models.generateContent({
      model: modelIdSpeech,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      throw new Error("No audio data generated.");
    }

    return audioData;

  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Failed to generate audio.");
  }
};

/**
 * Decodes base64 audio string for playback
 */
export const playAudioFromBase64 = async (base64Audio: string, audioContext: AudioContext): Promise<AudioBufferSourceNode> => {
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  
  return source;
};
