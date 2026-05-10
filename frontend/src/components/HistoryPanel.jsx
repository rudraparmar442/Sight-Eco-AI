import { Trash2, RotateCw, Clock } from "lucide-react";
import { useA11y, useSpeech } from "../a11y";
import { useT } from "../i18n";

export const HistoryPanel = ({ items, onClear }) => {
    const { lang, captionLang } = useA11y();
    const t = useT(lang);
    const { speak } = useSpeech(captionLang);

    return (
        <section
            className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16"
            aria-labelledby="history-title"
            data-testid="history-section"
        >
            <div className="flex items-center justify-between mb-6">
                <h2
                    id="history-title"
                    className="font-display text-2xl sm:text-3xl font-bold flex items-center gap-3"
                >
                    <Clock className="w-6 h-6" strokeWidth={2.6} />
                    {t.history.title}
                </h2>
                {items.length > 0 && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="h-11 px-4 border-2 border-destructive text-destructive font-bold flex items-center gap-2 hover:bg-destructive hover:text-white rounded-sm"
                        data-testid="clear-history-button"
                    >
                        <Trash2 className="w-4 h-4" strokeWidth={2.6} /> {t.history.clear}
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <div
                    className="border-2 border-dashed border-border p-10 text-center text-muted-foreground rounded-sm"
                    data-testid="history-empty"
                >
                    {t.history.empty}
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="history-list">
                    {items.map((it) => (
                        <li
                            key={it.id}
                            className="border-2 border-border bg-card p-5 rounded-sm flex flex-col gap-3"
                            data-testid={`history-item-${it.id}`}
                        >
                            <p
                                className="font-display text-lg leading-snug"
                                lang={it.language === "hi" ? "hi" : "en"}
                            >
                                {it.caption}
                            </p>
                            <div className="flex items-center justify-between gap-3 mt-auto">
                                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-mono">
                                    {new Date(it.created_at).toLocaleString()} ·{" "}
                                    {it.language.toUpperCase()}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => speak(it.caption)}
                                    className="h-9 px-3 bg-brand-yellow text-black font-bold flex items-center gap-2 hover:bg-brand-yellowHover rounded-sm text-sm"
                                    data-testid={`history-replay-${it.id}`}
                                >
                                    <RotateCw className="w-4 h-4" strokeWidth={2.6} />{" "}
                                    {t.history.replay}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};
