import { CheckCircle, Clock, MessageSquare, Bell } from "lucide-react";

const ICON_CONFIG = {
  confirmed: { bg: "bg-green-tint", color: "#0F3D1E", Icon: CheckCircle },
  completed: { bg: "bg-green-tint", color: "#0F3D1E", Icon: CheckCircle },
  request:   { bg: "bg-orange-tint", color: "#CC4A00", Icon: Clock },
  message:   { bg: "bg-border", color: "#555555", Icon: MessageSquare },
};

export default function Notification({ notification, onClick }) {
  const { type, text, time, read } = notification;
  const { bg, color, Icon } = ICON_CONFIG[type] || { bg: "bg-border", color: "#555555", Icon: Bell };

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-xl ${
        read
          ? "bg-white border border-border/50"
          : "bg-page-warm border-l-[3px] border-l-orange"
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center shrink-0`}>
        <Icon size={18} color={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink leading-snug">{text}</div>
        <div className="text-xs text-ink-muted mt-1">{time}</div>
      </div>
    </div>
  );
}
