import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Badge({ children, className = "" }: Props) {
  return <div className={`badge ${className}`}>{children}</div>;
}