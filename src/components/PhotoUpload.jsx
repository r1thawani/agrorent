import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function PhotoUpload({ photos = [], onChange, maxPhotos = 10 }) {
  const [dragging, setDragging] = useState(false);

  function readFiles(files) {
    const remaining = maxPhotos - photos.length;
    const toRead = Array.from(files).slice(0, remaining);
    if (!toRead.length) return;

    const readers = toRead.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then((results) => {
      onChange([...photos, ...results]);
    });
  }

  function handleFileChange(e) {
    readFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    readFiles(e.dataTransfer.files);
  }

  function remove(index) {
    onChange(photos.filter((_, i) => i !== index));
  }

  const isFull = photos.length >= maxPhotos;

  return (
    <div>
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {photos.map((src, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-border/50"
            >
              <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-[5px] py-[1px] rounded">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-white border-none cursor-pointer flex items-center justify-center shadow-sm p-0"
              >
                <X size={11} color="#555555" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isFull && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex items-center justify-center w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors duration-150 ${
            photos.length > 0 ? "flex-row gap-2 h-14" : "flex-col gap-1.5 h-[120px]"
          } ${dragging ? "border-orange bg-peach" : "border-border bg-page"}`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Upload size={photos.length > 0 ? 18 : 26} color="#555555" />
          {photos.length === 0 ? (
            <>
              <span className="text-sm text-ink-muted">Click to upload or drag and drop</span>
              <span className="text-xs text-ink-muted">
                Up to {maxPhotos} photos — JPG or PNG. First photo is the cover image.
              </span>
            </>
          ) : (
            <span className="text-sm text-ink-muted">
              Add more photos ({photos.length}/{maxPhotos})
            </span>
          )}
        </label>
      )}
    </div>
  );
}
