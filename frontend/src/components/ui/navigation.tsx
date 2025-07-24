import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/templates", label: "Templates" },
  { to: "/generate", label: "Generate" },
];

export function Navigation() {
  const location = useLocation();
  return (
    <nav className="flex gap-4 items-center">
      {navLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            location.pathname === link.to ? "text-primary underline" : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
