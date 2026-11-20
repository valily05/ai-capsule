import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function BrandMark({ small = false }) {
  return (
    <span className={`brand-mark${small ? " brand-mark-small" : ""}`} aria-hidden="true">
      <Sparkles size={small ? 17 : 19} strokeWidth={2.2} />
    </span>
  );
}

export function Brand({ to = "/", compact = false }) {
  return (
    <Link to={to} className={`brand${compact ? " brand-compact" : ""}`}>
      <BrandMark small={compact} />
      <span>AI Capsule</span>
    </Link>
  );
}
