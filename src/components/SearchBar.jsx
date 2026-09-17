import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search equipment…" }) {
  return (
    <div className="relative mb-5">
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-[34px] pr-3 text-[13px] border-[1.5px] border-border rounded-lg outline-none"
      />
    </div>
  );
}
