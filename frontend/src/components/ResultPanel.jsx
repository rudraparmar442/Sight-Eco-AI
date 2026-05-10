import { useEffect } from "react";
import { Play, Pause, Square, Copy, Download, Volume2, RotateCw } from "lucide-react";
import { useA11y, useSpeech } from "../a11y";
import { useT } from "../i18n";
import { toast } from "sonner";

export const ResultPanel = ({ caption, captionLang }) => {
    const { lang, captionLang: ctxLang, setCaptionLang, announce } = useA11y();
    const t = useT(lang);
    const speakLang = captionLang || ctxLang;
    const { status, speak, pause, resume, stop } = useSpeech(speakLang);

    useEffect(() => {
        return () => stop();
    }, [stop]);

    const onCopy = async () => {
        if (!caption) return;
        try {
            await navigator.clipboard.writeText(caption);
            toast.success(t.result.copied);
            announce(t.result.copied);
        } catch {
            toast.error("Copy failed");
        }
    };

    const onDownload = () => {
        if (!caption) return;
        const blob = new Blob([caption], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sighteco-caption-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section
            id="result"
            className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16"
            aria-labelledby="result-title"
            data-testid="result-section"
        >
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <h2 id="result-title" className="font-display text-2xl sm:text-3xl font-bold">
                    {t.result.title}
                </h2>
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="caption-language"
                        className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono"
                    >
                        {t.result.language}
                    </label>
                    <select
                        id="caption-language"
                        value={ctxLang}
                        onChange={(e) => setCaptionLang(e.target.value)}
                        className="h-10 px-3 bg-background border-2 border-border focus:border-brand-yellow font-bold text-sm rounded-sm"
                        data-testid="caption-language-select"
                    >
                        <option value="en">English</option>
                        <option value="hi">हिन्दी</option>
                    </select>
                </div>
            </div>

            <div
                className="relative border-2 border-border bg-card p-8 md:p-12 rounded-sm"
                data-testid="caption-card"
            >
                <div className="flex items-start gap-4">
                    <div className="hidden sm:flex w-12 h-12 bg-brand-yellow text-black items-center justify-center flex-shrink-0 rounded-sm">
                        <Volume2 className="w-6 h-6" strokeWidth={2.6} />
                    </div>
                    <p
                        className={`font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight ${
                            caption ? "text-foreground" : "text-muted-foreground italic"
                        }`}
                        aria-live="polite"
                        aria-atomic="true"
                        lang={speakLang === "hi" ? "hi" : "en"}
                        data-testid="caption-text"
                    >
                        {caption || t.result.empty}
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-2">
                    {status === "idle" && (
                        <button
                            type="button"
                            onClick={() => speak(caption)}
                            disabled={!caption}
                            className="h-12 px-5 bg-brand-yellow text-black font-bold flex items-center gap-2 hover:bg-brand-yellowHover disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                            data-testid="play-caption-button"
                        >
                            <Play className="w-5 h-5" strokeWidth={2.6} /> {t.result.play}
                        </button>
                    )}
                    {status === "speaking" && (
                        <button
                            type="button"
                            onClick={pause}
                            className="h-12 px-5 bg-brand-yellow text-black font-bold flex items-center gap-2 hover:bg-brand-yellowHover rounded-sm animate-pulse-ring"
                            data-testid="pause-caption-button"
                        >
                            <Pause className="w-5 h-5" strokeWidth={2.6} /> {t.result.pause}
                        </button>
                    )}
                    {status === "paused" && (
                        <button
                            type="button"
                            onClick={resume}
                            className="h-12 px-5 bg-brand-yellow text-black font-bold flex items-center gap-2 hover:bg-brand-yellowHover rounded-sm"
                            data-testid="resume-caption-button"
                        >
                            <RotateCw className="w-5 h-5" strokeWidth={2.6} /> {t.result.resume}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={stop}
                        disabled={status === "idle"}
                        className="h-12 px-5 border-2 border-foreground font-bold flex items-center gap-2 hover:bg-foreground hover:text-background disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                        data-testid="stop-caption-button"
                    >
                        <Square className="w-5 h-5" strokeWidth={2.6} /> {t.result.stop}
                    </button>
                    <button
                        type="button"
                        onClick={onCopy}
                        disabled={!caption}
                        className="h-12 px-5 border-2 border-border font-bold flex items-center gap-2 hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                        data-testid="copy-caption-button"
                    >
                        <Copy className="w-5 h-5" strokeWidth={2.6} /> {t.result.copy}
                    </button>
                    <button
                        type="button"
                        onClick={onDownload}
                        disabled={!caption}
                        className="h-12 px-5 border-2 border-border font-bold flex items-center gap-2 hover:border-foreground disabled:opacity-40 disabled:cursor-not-allowed rounded-sm"
                        data-testid="download-caption-button"
                    >
                        <Download className="w-5 h-5" strokeWidth={2.6} /> {t.result.download}
                    </button>
                </div>
            </div>
        </section>
    );
};
