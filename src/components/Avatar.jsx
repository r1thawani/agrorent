export default function Avatar({ src, name = "", className = "" }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-green-tint flex items-center justify-center shrink-0 font-medium text-green-dark select-none ${className}`}
    >
      {initials || (
        <svg viewBox="0 0 24 24" fill="none" className="w-1/2 h-1/2 opacity-40">
          <path
            d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z"
            fill="currentColor"
          />
        </svg>
      )}
    </div>
  );
}
