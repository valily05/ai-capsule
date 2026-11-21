import { Link } from "react-router-dom";

export function BrandMark({ small = false, large = false, className = "" }) {
  const classes = [
    "brand-mark",
    small && "brand-mark-small",
    large && "brand-mark-large",
    className,
  ].filter(Boolean).join(" ");

  return (
    <span className={classes} aria-hidden="true">
      <img src="/favicon.svg" alt="" />
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
