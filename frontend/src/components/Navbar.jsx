import { Eye, Moon, Sun, Settings2 } from "lucide-react";
import { useA11y } from "../a11y";
import { useT } from "../i18n";

export const Navbar = ({ onOpenA11y }) => {
    const { darkMode, setDarkMode, lang } = useA11y();
    const t = useT(lang);

    return (
        <nav
            className="sticky top-0 z-40 border-b border-border/60 glass"
            role="navigation"
            aria-label="Primary"
            data-testid="primary-nav"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-10 py-4">
                <a href="#top" className="flex items-center gap-3" data-testid="nav-brand">
                    <div className="w-10 h-10 bg-brand-yellow flex items-center justify-center rounded-sm">
                        <Eye className="w-5 h-5 text-black" strokeWidth={2.6} />
                    </div>
                    <span className="font-display text-xl font-black tracking-tight">
                        {t.nav.brand}
                    </span>
                </a>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setDarkMode(!darkMode)}
                        aria-label={t.nav.darkMode}
                        aria-pressed={darkMode}
                        className="h-12 w-12 flex items-center justify-center border border-border hover:bg-brand-yellow hover:text-black transition-colors duration-150 rounded-sm"
                        data-testid="dark-mode-toggle"
                    >
                        {darkMode ? <Moon className="w-5 h-5" strokeWidth={2.4} /> : <Sun className="w-5 h-5" strokeWidth={2.4} />}
                    </button>
                    <button
                        type="button"
                        onClick={onOpenA11y}
                        aria-label={t.nav.a11y}
                        className="h-12 px-4 flex items-center gap-2 bg-brand-yellow text-black font-bold hover:bg-brand-yellowHover transition-colors duration-150 rounded-sm"
                        data-testid="open-a11y-panel-button"
                    >
                        <Settings2 className="w-5 h-5" strokeWidth={2.6} />
                        <span className="hidden sm:inline text-sm font-bold uppercase tracking-wider">
                            A11y
                        </span>
                    </button>
                </div>
            </div>
        </nav>
    );
};
