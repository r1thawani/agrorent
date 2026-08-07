import { useState } from "react";
import { Upload, X } from "lucide-react";

/**
 * PhotoUpload — reusable photo picker component
 * Props:
 *   photos      : string[]           — current list of data-URL or src strings
 *   onChange    : (photos) => void   — called whenever photos list changes
 *   maxPhotos   : number             — default 10
 */
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
    // reset so same file can be re-added after removal
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    readFiles(e.dataTransfer.files);
  }

  function remove(index) {
    const next = photos.filter((_, i) => i !== index);
    onChange(next);
  }

  const isFull = photos.length >= maxPhotos;

  return (
    <div>
      {/* Thumbnail strip — only shown when photos exist */}
      {photos.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {photos.map((src, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: 80,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                flexShrink: 0,
                border: "0.5px solid #E0E8E3",
              }}
            >
              <img
                src={src}
                alt={`Photo ${i + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {i === 0 && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 4,
                    fontSize: 10,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    padding: "1px 5px",
                    borderRadius: 4,
                  }}
                >
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  backgroundColor: "#fff",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  padding: 0,
                }}
              >
                <X size={11} color="#555555" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone — hidden when at max */}
      {!isFull && (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            display: "flex",
            flexDirection: photos.length > 0 ? "row" : "column",
            alignItems: "center",
            justifyContent: "center",
            gap: photos.length > 0 ? 8 : 6,
            width: "100%",
            height: photos.length > 0 ? 56 : 120,
            border: `2px dashed ${dragging ? "#FF5C00" : "#E0E8E3"}`,
            borderRadius: 12,
            backgroundColor: dragging ? "#FFF0E6" : "#F5F5F0",
            cursor: "pointer",
            transition: "border-color 0.15s, background-color 0.15s",
          }}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <Upload size={photos.length > 0 ? 18 : 26} color="#555555" />
          {photos.length === 0 ? (
            <>
              <span style={{ fontSize: 14, color: "#555555" }}>
                Click to upload or drag and drop
              </span>
              <span style={{ fontSize: 12, color: "#555555" }}>
                Up to {maxPhotos} photos — JPG or PNG. First photo is the cover image.
              </span>
            </>
          ) : (
            <span style={{ fontSize: 14, color: "#555555" }}>
              Add more photos ({photos.length}/{maxPhotos})
            </span>
          )}
        </label>
      )}
    </div>
  );
}
