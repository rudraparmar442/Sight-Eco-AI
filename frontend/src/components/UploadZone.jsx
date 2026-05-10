import { useCallback, useRef, useState } from "react";
import { Upload, Loader2, RefreshCw } from "lucide-react";
import { useA11y } from "../a11y";
import { useT } from "../i18n";

export const UploadZone = ({ onFile, loading, previewUrl, onReset, inputRef }) => {
    const { lang, announce } = useA11y();
    const t = useT(lang);
    const [drag, setDrag] = useState(false);
    const localRef = useRef(null);
    const fileRef = inputRef || localRef;

    const handleFiles = useCallback(
        (files) => {
            const file = files?.[0];
            if (!file) return;
            if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
                announce("Unsupported file type. Use JPEG, PNG, or WEBP.");
                return;
            }
            announce(t.upload.uploadedAnnounce);
            onFile(file);
        },
        [announce, onFile, t.upload.uploadedAnnounce],
    );

    const onDrop = (e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <section
            id="upload"
            className="max-w-7xl mx-auto px-6 md:px-10 py-12 md:py-16"
            aria-labelledby="upload-title"
            data-testid="upload-section"
        >
            <div className="flex items-baseline justify-between mb-6">
                <h2 id="upload-title" className="font-display text-2xl sm:text-3xl font-bold">
                    {t.upload.title}
                </h2>
                {previewUrl && !loading && (
                    <button
                        type="button"
                        onClick={onReset}
                        className="text-sm font-bold uppercase tracking-wider text-brand-yellow hover:underline flex items-center gap-2"
                        data-testid="reset-upload-button"
                    >
                        <RefreshCw className="w-4 h-4" strokeWidth={2.6} /> {t.upload.replace}
                    </button>
                )}
            </div>

            {!previewUrl ? (
                <div
                    role="button"
                    tabIndex={0}
                    aria-label={t.upload.drop}
                    onClick={() => fileRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileRef.current?.click();
                        }
                    }}
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={onDrop}
                    className={`relative cursor-pointer h-72 md:h-80 border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center text-center px-6 rounded-sm ${
                        drag
                            ? "border-brand-yellow bg-brand-yellow/10"
                            : "border-border hover:border-foreground bg-card"
                    }`}
                    data-testid="upload-dropzone"
                >
                    <div className="w-16 h-16 bg-brand-yellow text-black flex items-center justify-center mb-5 rounded-sm">
                        <Upload className="w-7 h-7" strokeWidth={2.6} />
                    </div>
                    <p className="font-display text-2xl md:text-3xl font-bold mb-2">{t.upload.drop}</p>
                    <p className="text-sm text-muted-foreground mb-4">{t.upload.or}</p>
                    <span className="inline-flex h-12 px-6 bg-foreground text-background font-bold items-center rounded-sm">
                        {t.upload.browse}
                    </span>
                    <p className="mt-6 text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono">
                        {t.upload.hint}
                    </p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="sr-only"
                        onChange={(e) => handleFiles(e.target.files)}
                        data-testid="upload-file-input"
                        aria-label={t.upload.browse}
                    />
                </div>
            ) : (
                <div
                    className="relative overflow-hidden border border-border bg-card rounded-sm"
                    data-testid="image-preview-container"
                >
                    <img
                        src={previewUrl}
                        alt="Uploaded preview, awaiting AI description"
                        className="w-full max-h-[520px] object-contain bg-black"
                        data-testid="image-preview"
                    />
                    {loading && (
                        <div
                            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm"
                            role="status"
                            aria-live="polite"
                            data-testid="upload-loading"
                        >
                            <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mb-4" strokeWidth={2.6} />
                            <p className="font-display text-xl text-white">{t.upload.analyzing}</p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
