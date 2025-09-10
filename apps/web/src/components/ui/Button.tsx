import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  className?: string;
};

export default function Button({ variant="primary", className="", ...props }: Props) {
  const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-ghost");
  return <button className={`${base} ${className}`} {...props} />;
}