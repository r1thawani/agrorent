import StarRating from "./StarRating";

export default function ReviewCard({ review }) {
  const { name, photo, date, rating, text, reply } = review;

  return (
    <div className="bg-white border border-border/50 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <img
            src={photo}
            alt={name}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="text-sm font-medium text-ink">{name}</span>
        </div>
        <span className="text-xs text-ink-muted">{date}</span>
      </div>

      <StarRating rating={rating} />

      <p className="text-sm text-ink mt-2 leading-relaxed">{text}</p>

      {reply && (
        <div className="mt-3 pl-3 border-l-[3px] border-l-green">
          <div className="text-xs font-medium text-green">Owner reply:</div>
          <p className="text-sm text-ink mt-1">{reply}</p>
        </div>
      )}
    </div>
  );
}
