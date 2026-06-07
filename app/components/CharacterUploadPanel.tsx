"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, RotateCcw, Sparkles, Upload, X } from "lucide-react";

interface CharacterUploadPanelProps {
  open: boolean;
  hasCharacter: boolean;
  onConfirm: (file: File, name: string) => void;
  onCancel: () => void;
  onRestoreDefault: () => void;
}

export default function CharacterUploadPanel({
  open,
  hasCharacter,
  onConfirm,
  onCancel,
  onRestoreDefault
}: CharacterUploadPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevPreviewUrlRef = useRef<string | null>(null);

  /* ---- helpers ---- */
  function revokePreview() {
    if (prevPreviewUrlRef.current) {
      URL.revokeObjectURL(prevPreviewUrlRef.current);
      prevPreviewUrlRef.current = null;
    }
  }

  function acceptFile(incoming: File) {
    setError(null);

    if (!incoming.type.startsWith("image/")) {
      setError("This doesn't seem to be an image. Try a photo or illustration instead.");
      return;
    }

    revokePreview();

    const url = URL.createObjectURL(incoming);
    prevPreviewUrlRef.current = url;
    setPreviewUrl(url);
    setFile(incoming);

    /* auto-fill name from filename, stripped of extension */
    const dotIndex = incoming.name.lastIndexOf(".");
    const baseName = dotIndex > 0 ? incoming.name.slice(0, dotIndex) : incoming.name;
    setName(baseName.slice(0, 48));
  }

  function resetPanel() {
    setFile(null);
    setPreviewUrl(null);
    setName("");
    setError(null);
    setIsDragOver(false);
    revokePreview();
  }

  /* ---- revoke blob URL on unmount ---- */
  useEffect(() => {
    return () => {
      revokePreview();
    };
  }, []);

  /* ---- handlers ---- */
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) acceptFile(selected);
    /* reset so the same file can be re-selected */
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) acceptFile(dropped);
  }

  function handleConfirm() {
    if (!file) return;
    onConfirm(file, name.trim());
    resetPanel();
  }

  function handleCancel() {
    resetPanel();
    onCancel();
  }

  function handleRestoreDefault() {
    resetPanel();
    onRestoreDefault();
  }

  /* ---- render ---- */
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/62 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* panel */}
          <motion.div
            className="glass-panel relative z-10 flex w-full max-w-lg flex-col gap-5 rounded-[28px] p-6"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#8ff8dd]" />
                <span className="text-sm font-medium text-white/82">Choose a Face</span>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/[0.08] text-white/48 transition hover:border-white/18 hover:text-white/78"
                aria-label="Close upload panel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] border border-dashed p-8 transition duration-300",
                isDragOver
                  ? "border-[#8ff8dd]/52 bg-[#8ff8dd]/[0.06] shadow-[0_0_40px_rgba(143,248,221,0.12)]"
                  : "border-white/[0.10] bg-white/[0.025] hover:border-white/[0.18]"
              ].join(" ")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              aria-label="Click or drag an image to upload"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Character preview"
                  className="max-h-[220px] rounded-[16px] object-contain"
                />
              ) : (
                <>
                  <span
                    className={[
                      "grid h-14 w-14 place-items-center rounded-[18px] border transition",
                      isDragOver
                        ? "border-[#8ff8dd]/42 bg-[#8ff8dd]/14 text-[#bfffee]"
                        : "border-white/10 bg-black/20 text-white/48"
                    ].join(" ")}
                  >
                    {isDragOver ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <Upload className="h-5 w-5" />
                    )}
                  </span>
                  <span className="text-center text-sm text-white/54">
                    {isDragOver
                      ? "Let go — I'll hold this gently."
                      : "Drop an image here, or click to browse"}
                  </span>
                  <span className="text-xs text-white/28">Images only</span>
                </>
              )}
            </div>

            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />

            {/* validation error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="-mt-2 flex items-center gap-2 rounded-[14px] border border-[#f2c391]/18 bg-[#f2c391]/[0.06] px-3 py-2 text-xs text-[#f2c391]/86"
                >
                  <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* name input */}
            <div className="space-y-1.5">
              <label
                htmlFor="character-name"
                className="block text-xs uppercase tracking-[0.22em] text-white/38"
              >
                Name
              </label>
              <input
                id="character-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Give them a name, or leave it quiet..."
                maxLength={48}
                className="w-full rounded-[16px] border border-white/[0.08] bg-white/[0.045] px-4 py-2.5 text-sm text-white/82 outline-none transition placeholder:text-white/24 focus:border-[#8ff8dd]/36 focus:bg-white/[0.065]"
              />
            </div>

            {/* actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-[16px] border border-white/[0.08] bg-white/[0.04] px-5 py-2.5 text-sm text-white/58 transition hover:border-white/14 hover:text-white/78"
              >
                Cancel
              </button>

              {hasCharacter && (
                <button
                  type="button"
                  onClick={handleRestoreDefault}
                  className="ml-auto flex items-center gap-2 rounded-[16px] border border-white/[0.07] bg-transparent px-4 py-2.5 text-sm text-white/44 transition hover:border-[#f2c391]/22 hover:text-[#f2c391]/78"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore Default
                </button>
              )}

              <button
                type="button"
                disabled={!file}
                onClick={handleConfirm}
                className={[
                  "ml-auto flex items-center gap-2 rounded-[16px] px-5 py-2.5 text-sm font-medium transition",
                  file
                    ? "bg-[#8ff8dd]/18 text-[#bfffee] shadow-[0_0_28px_rgba(143,248,221,0.18)] hover:bg-[#8ff8dd]/26"
                    : "cursor-not-allowed bg-white/[0.04] text-white/22"
                ].join(" ")}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
