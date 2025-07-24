import * as React from "react";
import { cn } from "../../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ value, className, ...props }, ref) => (
  <div ref={ref} className={cn("w-full h-3 bg-muted rounded-full overflow-hidden", className)} {...props}>
    <div
      className="h-full bg-primary transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
));
Progress.displayName = "Progress";
