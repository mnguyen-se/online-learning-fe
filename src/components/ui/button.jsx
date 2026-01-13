import { cn } from "./utils";

export function Button({ className, ...props }) {
  return (
    <button
      className={cn(
        "h-9 px-4 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition",
        className
      )}
      {...props}
    />
  );
}
