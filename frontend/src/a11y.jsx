import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const A11yContext = createContext(null);

const FONT_STEPS = [14, 16, 18, 20, 22, 24];
const DEFAULT_INDEX = 1;

const load = (k, d) => {
    try {
        const v = localStorage.getItem(k);
        return v === null ? d : JSON.parse(v);
    } catch {
        return d;
    }
};

export const A11yProvider = ({ children }) => {
    const [highContrast, setHighContrast] = useState(() => load("se_hc", false));
    const [darkMode, setDarkMode] = useState(() => load("se_dark", true));
    const [voiceGuidance, setVoiceGuidance] = useState(() => load("se_vg", false));
    const [fontIdx, setFontIdx] = useState(() => load("se_fi", DEFAULT_INDEX));
    const [lang, setLang] = useState(() => load("se_lang", "en"));
    const [captionLang, setCaptionLang] = useState(() => load("se_clang", "en"));

    useEffect(() => {
        document.documentElement.style.setProperty("--app-font-size", `${FONT_STEPS[fontIdx]}px`);
        localStorage.setItem("se_fi", JSON.stringify(fontIdx));
    }, [fontIdx]);

    useEffect(() => {
        document.documentElement.classList.toggle("high-contrast", highContrast);
        localStorage.setItem("se_hc", JSON.stringify(highContrast));
    }, [highContrast]);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
        localStorage.setItem("se_dark", JSON.stringify(darkMode));
    }, [darkMode]);

    useEffect(() => {
        localStorage.setItem("se_vg", JSON.stringify(voiceGuidance));
    }, [voiceGuidance]);

    useEffect(() => {
        localStorage.setItem("se_lang", JSON.stringify(lang));
        document.documentElement.lang = lang;
    }, [lang]);

    useEffect(() => {
        localStorage.setItem("se_clang", JSON.stringify(captionLang));
    }, [captionLang]);

    const announce = useCallback(
        (text) => {
            if (!voiceGuidance || !window.speechSynthesis || !text) return;
            const u = new SpeechSynthesisUtterance(text);
            u.lang = lang === "hi" ? "hi-IN" : "en-US";
            u.rate = 1;
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(u);
        },
        [voiceGuidance, lang],
    );

    const value = useMemo(
        () => ({
            highContrast,
            setHighContrast,
            darkMode,
            setDarkMode,
            voiceGuidance,
            setVoiceGuidance,
            fontIdx,
            setFontIdx,
            fontSize: FONT_STEPS[fontIdx],
            increaseFont: () => setFontIdx((i) => Math.min(FONT_STEPS.length - 1, i + 1)),
            decreaseFont: () => setFontIdx((i) => Math.max(0, i - 1)),
            resetFont: () => setFontIdx(DEFAULT_INDEX),
            lang,
            setLang,
            captionLang,
            setCaptionLang,
            announce,
        }),
        [highContrast, darkMode, voiceGuidance, fontIdx, lang, captionLang, announce],
    );

    return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>;
};

export const useA11y = () => {
    const ctx = useContext(A11yContext);
    if (!ctx) throw new Error("useA11y must be used within A11yProvider");
    return ctx;
};

// ---------------------- Speech synthesis hook ---------------------- //
export const useSpeech = (lang = "en") => {
    const [status, setStatus] = useState("idle"); // idle | speaking | paused
    const utterRef = useRef(null);

    useEffect(() => {
        return () => {
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        };
    }, []);

    const speak = useCallback(
        (text) => {
            if (!text || !window.speechSynthesis) return;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = lang === "hi" ? "hi-IN" : "en-US";
            u.rate = 1;
            u.pitch = 1;
            u.onend = () => setStatus("idle");
            u.onerror = () => setStatus("idle");
            utterRef.current = u;
            window.speechSynthesis.speak(u);
            setStatus("speaking");
        },
        [lang],
    );

    const pause = useCallback(() => {
        if (window.speechSynthesis?.speaking) {
            window.speechSynthesis.pause();
            setStatus("paused");
        }
    }, []);

    const resume = useCallback(() => {
        if (window.speechSynthesis?.paused) {
            window.speechSynthesis.resume();
            setStatus("speaking");
        }
    }, []);

    const stop = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            setStatus("idle");
        }
    }, []);

    return { status, speak, pause, resume, stop };
};

// ---------------------- Speech recognition hook ---------------------- //
export const useSpeechRecognition = (lang = "en") => {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [supported, setSupported] = useState(true);
    const recRef = useRef(null);

    useEffect(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            setSupported(false);
            return;
        }
        const rec = new SR();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = lang === "hi" ? "hi-IN" : "en-US";
        rec.onresult = (e) => {
            const t = Array.from(e.results)
                .map((r) => r[0].transcript)
                .join(" ")
                .trim();
            setTranscript(t);
        };
        rec.onend = () => setListening(false);
        rec.onerror = () => setListening(false);
        recRef.current = rec;
    }, [lang]);

    const start = useCallback(() => {
        if (!recRef.current) return;
        try {
            setTranscript("");
            recRef.current.start();
            setListening(true);
        } catch {
            /* already running */
        }
    }, []);

    const stop = useCallback(() => {
        if (!recRef.current) return;
        try {
            recRef.current.stop();
        } catch {
            /* noop */
        }
        setListening(false);
    }, []);

    return { listening, transcript, supported, start, stop, setTranscript };
};
