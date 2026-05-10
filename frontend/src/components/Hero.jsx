import { ArrowDown, Mic } from "lucide-react";
import { useA11y } from "../a11y";
import { useT } from "../i18n";

export const Hero = ({ onUploadClick, onVoiceClick }) => {
    const { lang } = useA11y();
    const t = useT(lang);

    return (
        <section
            id="top"
            className="relative overflow-hidden border-b border-border noise"
            aria-labelledby="hero-title"
            data-testid="hero-section"
        >
            <div className="absolute inset-0 grid-bg opacity-60" aria-hidden="true" />
            <div
                className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-brand-yellow/10 blur-3xl"
                aria-hidden="true"
            />
            <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-20 md:pt-24 md:pb-28">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-brand-yellow text-brand-yellow text-xs font-bold uppercase tracking-[0.18em] mb-8 animate-fade-up rounded-sm">
                    <span className="w-2 h-2 bg-brand-yellow animate-pulse" aria-hidden="true" />
                    {t.hero.badge}
                </div>

                <h1
                    id="hero-title"
                    className="font-display text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter max-w-4xl leading-[0.95] animate-fade-up"
                    style={{ animationDelay: "60ms" }}
                >
                    {t.hero.title.split(" ").slice(0, -2).join(" ")}{" "}
                    <span className="text-brand-yellow text-glow-yellow">
                        {t.hero.title.split(" ").slice(-2).join(" ")}
                    </span>
                </h1>

                <p
                    className="mt-6 max-w-2xl text-lg lg:text-xl text-muted-foreground animate-fade-up"
                    style={{ animationDelay: "120ms" }}
                >
                    {t.hero.subtitle}
                </p>

                <div
                    className="mt-10 flex flex-wrap gap-3 animate-fade-up"
                    style={{ animationDelay: "180ms" }}
                >
                    <button
                        type="button"
                        onClick={onUploadClick}
                        className="group h-14 px-8 bg-brand-yellow text-black font-display font-bold text-base flex items-center gap-3 hover:bg-brand-yellowHover transition-colors duration-150 rounded-sm shadow-[6px_6px_0_0_#000]"
                        data-testid="hero-upload-cta"
                    >
                        {t.hero.uploadCta}
                        <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" strokeWidth={2.6} />
                    </button>

                    <button
                        type="button"
                        onClick={onVoiceClick}
                        className="h-14 px-6 border-2 border-foreground text-foreground font-display font-bold text-base flex items-center gap-3 hover:bg-foreground hover:text-background transition-colors duration-150 rounded-sm"
                        data-testid="hero-voice-cta"
                    >
                        <Mic className="w-5 h-5" strokeWidth={2.6} />
                        {t.hero.voiceCta}
                    </button>
                </div>

                <p className="mt-10 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                    {t.hero.scrollHint}
                </p>
            </div>
        </section>
    );
};
