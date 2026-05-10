import { Eye } from "lucide-react";
import { useA11y } from "../a11y";
import { useT } from "../i18n";

export const Footer = () => {
    const { lang } = useA11y();
    const t = useT(lang);
    return (
        <footer
            className="border-t border-border mt-12"
            role="contentinfo"
            data-testid="site-footer"
        >
            <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-brand-yellow flex items-center justify-center rounded-sm">
                        <Eye className="w-4 h-4 text-black" strokeWidth={2.6} />
                    </div>
                    <div>
                        <p className="font-display text-lg font-black">{t.footer.madeBy}</p>
                        <p className="text-sm text-muted-foreground">{t.footer.tagline}</p>
                    </div>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                    WCAG AAA · Atkinson Hyperlegible · Cabinet Grotesk
                </p>
            </div>
        </footer>
    );
};
