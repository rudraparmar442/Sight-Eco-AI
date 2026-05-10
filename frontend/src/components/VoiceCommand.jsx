import { Mic, MicOff } from "lucide-react";
import { useEffect } from "react";
import { useA11y, useSpeechRecognition } from "../a11y";
import { useT } from "../i18n";

export const VoiceCommand = ({ onCommand }) => {
    const { lang, announce } = useA11y();
    const t = useT(lang);
    const { listening, transcript, supported, start, stop } = useSpeechRecognition(lang);

    useEffect(() => {
        if (!transcript) return;
        const lc = transcript.toLowerCase();
        if (/(upload|छवि|अपलोड)/.test(lc)) {
            onCommand("upload");
            announce("Opening upload");
        } else if (/(read|caption|सुन|पढ़)/.test(lc)) {
            onCommand("read");
            announce("Reading caption");
        } else if (/(stop|बंद|रोक)/.test(lc)) {
            onCommand("stop");
        } else if (/(copy|कॉपी)/.test(lc)) {
            onCommand("copy");
        }
    }, [transcript, onCommand, announce]);

    if (!supported) return null;

    return (
        <div
            className="fixed bottom-6 left-6 z-30 flex flex-col items-start gap-2"
            data-testid="voice-command-fab"
        >
            <button
                type="button"
                onClick={listening ? stop : start}
                aria-pressed={listening}
                aria-label={listening ? t.voice.stop : t.voice.listen}
                className={`h-14 w-14 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
                    listening
                        ? "bg-destructive border-destructive text-white animate-pulse-ring"
                        : "bg-brand-yellow border-black text-black hover:bg-brand-yellowHover"
                }`}
                data-testid="voice-toggle-button"
            >
                {listening ? (
                    <MicOff className="w-6 h-6" strokeWidth={2.6} />
                ) : (
                    <Mic className="w-6 h-6" strokeWidth={2.6} />
                )}
            </button>
            {transcript && (
                <div
                    className="max-w-xs glass px-3 py-2 text-xs font-mono text-foreground rounded-sm"
                    aria-live="polite"
                    data-testid="voice-transcript"
                >
                    <span className="text-brand-yellow font-bold mr-1">{t.voice.heard}</span>
                    {transcript}
                </div>
            )}
        </div>
    );
};
