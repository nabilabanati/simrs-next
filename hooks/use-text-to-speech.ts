import { useCallback } from "react";

export const useTextToSpeech = () => {
  const speak = useCallback((text: string) => {
    // Check browser support
    const synth = window.speechSynthesis;
    
    if (!synth) {
      console.warn("Speech Synthesis not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.lang = "id-ID"; // Indonesian language

    synth.speak(utterance);
  }, []);

  return { speak };
};
