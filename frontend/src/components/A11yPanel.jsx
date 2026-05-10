import { X, Plus, Minus, RotateCcw, Contrast, Volume2, Moon, Languages } from "lucide-react";
import { useA11y } from "../a11y";
import { useT } from "../i18n";

export const A11yPanel = ({ open, onClose }) => {
    const {
        highContrast,
        setHighContrast,
        darkMode,
        setDarkMode,
        voiceGuidance,
        setVoiceGuidance,
        increaseFont,
        decreaseFont,
        resetFont,
        fontSize,
        lang,
        setLang,
    } = useA11y();
    const t = useT(lang);

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-card border-l-2 border-border z-50 transform transition-transform duration-300 ${
                    open ? "translate-x-0" : "translate-x-full"
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="a11y-title"
                data-testid="a11y-panel"
            >
                <div className="flex items-center justify-between p-6 border-b-2 border-border">
                    <h2 id="a11y-title" className="font-display text-2xl font-black">
                        {t.a11y.title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t.a11y.close}
                        className="w-12 h-12 flex items-center justify-center border-2 border-border hover:bg-brand-yellow hover:text-black rounded-sm"
                        data-testid="close-a11y-panel-button"
                    >
                        <X className="w-5 h-5" strokeWidth={2.6} />
                    </button>
                </div>

                <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-88px)]">
                    {/* Font size */}
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono mb-3">
                            {t.a11y.fontSize} · {fontSize}px
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={decreaseFont}
                                aria-label={t.a11y.decrease}
                                className="flex-1 h-14 border-2 border-border font-display font-black text-xl flex items-center justify-center gap-2 hover:border-foreground rounded-sm"
                                data-testid="font-decrease-button"
                            >
                                <Minus className="w-5 h-5" strokeWidth={2.6} /> A−
                            </button>
                            <button
                                type="button"
                                onClick={resetFont}
                                aria-label={t.a11y.reset}
                                className="h-14 px-4 border-2 border-border font-display font-bold flex items-center gap-2 hover:border-foreground rounded-sm"
                                data-testid="font-reset-button"
                            >
                                <RotateCcw className="w-5 h-5" strokeWidth={2.6} />
                            </button>
                            <button
                                type="button"
                                onClick={increaseFont}
                                aria-label={t.a11y.increase}
                                className="flex-1 h-14 bg-brand-yellow text-black font-display font-black text-xl flex items-center justify-center gap-2 hover:bg-brand-yellowHover rounded-sm"
                                data-testid="font-increase-button"
                            >
                                <Plus className="w-5 h-5" strokeWidth={2.6} /> A+
                            </button>
                        </div>
                    </div>

                    <ToggleRow
                        icon={<Contrast className="w-5 h-5" strokeWidth={2.6} />}
                        label={t.a11y.highContrast}
                        checked={highContrast}
                        onChange={() => setHighContrast(!highContrast)}
                        testid="high-contrast-toggle"
                    />
                    <ToggleRow
                        icon={<Moon className="w-5 h-5" strokeWidth={2.6} />}
                        label={t.a11y.darkMode}
                        checked={darkMode}
                        onChange={() => setDarkMode(!darkMode)}
                        testid="dark-mode-panel-toggle"
                    />
                    <ToggleRow
                        icon={<Volume2 className="w-5 h-5" strokeWidth={2.6} />}
                        label={t.a11y.voiceGuidance}
                        checked={voiceGuidance}
                        onChange={() => setVoiceGuidance(!voiceGuidance)}
                        testid="voice-guidance-toggle"
                    />

                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono mb-3 flex items-center gap-2">
                            <Languages className="w-4 h-4" strokeWidth={2.6} /> {t.a11y.language}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setLang("en")}
                                aria-pressed={lang === "en"}
                                className={`h-12 font-bold rounded-sm transition-colors ${
                                    lang === "en"
                                        ? "bg-brand-yellow text-black"
                                        : "border-2 border-border hover:border-foreground"
                                }`}
                                data-testid="lang-en-button"
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => setLang("hi")}
                                aria-pressed={lang === "hi"}
                                className={`h-12 font-bold rounded-sm transition-colors ${
                                    lang === "hi"
                                        ? "bg-brand-yellow text-black"
                                        : "border-2 border-border hover:border-foreground"
                                }`}
                                data-testid="lang-hi-button"
                            >
                                हिन्दी
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

const ToggleRow = ({ icon, label, checked, onChange, testid }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className="w-full flex items-center justify-between p-4 border-2 border-border hover:border-foreground transition-colors rounded-sm"
        data-testid={testid}
    >
        <span className="flex items-center gap-3 font-bold">
            {icon}
            {label}
        </span>
        <span
            className={`relative w-14 h-8 rounded-full transition-colors ${
                checked ? "bg-brand-yellow" : "bg-secondary"
            }`}
            aria-hidden="true"
        >
            <span
                className={`absolute top-1 left-1 w-6 h-6 bg-black rounded-full transition-transform ${
                    checked ? "translate-x-6" : ""
                }`}
            />
        </span>
    </button>
);
