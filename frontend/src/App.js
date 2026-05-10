import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { Toaster, toast } from "sonner";
import "@/App.css";

import { A11yProvider, useA11y } from "@/a11y";
import { useT } from "@/i18n";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { UploadZone } from "@/components/UploadZone";
import { ResultPanel } from "@/components/ResultPanel";
import { A11yPanel } from "@/components/A11yPanel";
import { HistoryPanel } from "@/components/HistoryPanel";
import { Footer } from "@/components/Footer";
import { VoiceCommand } from "@/components/VoiceCommand";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TOAST_OPTIONS = {
    style: {
        background: "#1A1A1A",
        border: "2px solid #FFEA00",
        color: "#fff",
    },
};

const Inner = () => {
    const { lang, captionLang, voiceGuidance, announce } = useA11y();
    const t = useT(lang);
    const [a11yOpen, setA11yOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [caption, setCaption] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const fileInputRef = useRef(null);
    const playRef = useRef(null);

    const fetchHistory = useCallback(async () => {
        try {
            const r = await axios.get(`${API}/history`);
            setHistory(r.data || []);
        } catch (e) {
            console.error("history error", e);
        }
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // Auto guidance welcome
    useEffect(() => {
        if (voiceGuidance) announce(t.voice.guidanceWelcome);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voiceGuidance, lang]);

    const triggerUpload = useCallback(() => {
        document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => fileInputRef.current?.click(), 320);
    }, []);

    const handleFile = useCallback(
        async (file) => {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setCaption("");
            setLoading(true);
            try {
                const fd = new FormData();
                fd.append("image", file);
                fd.append("language", captionLang);
                const r = await axios.post(`${API}/predict`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                setCaption(r.data.caption);
                announce(r.data.caption);
                fetchHistory();
                setTimeout(() => {
                    document
                        .getElementById("result")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 200);
            } catch (e) {
                console.error(e);
                toast.error(t.upload.error);
                announce(t.upload.error);
            } finally {
                setLoading(false);
            }
        },
        [captionLang, fetchHistory, announce, t.upload.error],
    );

    const reset = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setCaption("");
    };

    const clearHistory = async () => {
        try {
            await axios.delete(`${API}/history`);
            setHistory([]);
            toast.success("History cleared");
        } catch {
            toast.error("Failed to clear");
        }
    };

    const onVoiceCommand = useCallback(
        (cmd) => {
            if (cmd === "upload") triggerUpload();
            else if (cmd === "read" && caption) playRef.current?.click();
            else if (cmd === "stop" && window.speechSynthesis) window.speechSynthesis.cancel();
            else if (cmd === "copy" && caption) navigator.clipboard.writeText(caption);
        },
        [caption, triggerUpload],
    );

    // Keyboard shortcuts U=upload, R=read
    useEffect(() => {
        const onKey = (e) => {
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLSelectElement
            )
                return;
            if (e.key.toLowerCase() === "u") {
                e.preventDefault();
                triggerUpload();
            } else if (e.key.toLowerCase() === "r" && caption) {
                e.preventDefault();
                playRef.current?.click();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [caption, triggerUpload]);

    return (
        <div className="min-h-screen bg-background text-foreground">
            <a
                href="#upload"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-brand-yellow focus:text-black focus:px-4 focus:py-2 focus:font-bold rounded-sm"
                data-testid="skip-link"
            >
                Skip to upload
            </a>

            <Navbar onOpenA11y={() => setA11yOpen(true)} />

            <main id="main">
                <Hero
                    onUploadClick={triggerUpload}
                    onVoiceClick={() => document.querySelector('[data-testid="voice-toggle-button"]')?.click()}
                />
                <UploadZone
                    onFile={handleFile}
                    loading={loading}
                    previewUrl={previewUrl}
                    onReset={reset}
                    inputRef={fileInputRef}
                />
                <div ref={(el) => {
                    if (el) playRef.current = el.querySelector('[data-testid="play-caption-button"]');
                }}>
                    <ResultPanel caption={caption} captionLang={captionLang} />
                </div>
                <HistoryPanel items={history} onClear={clearHistory} />
            </main>

            <Footer />

            <A11yPanel open={a11yOpen} onClose={() => setA11yOpen(false)} />
            <VoiceCommand onCommand={onVoiceCommand} />

            <Toaster
                theme="dark"
                position="top-center"
                toastOptions={TOAST_OPTIONS}
            />
        </div>
    );
};

function App() {
    return (
        <A11yProvider>
            <Inner />
        </A11yProvider>
    );
}

export default App;
