/** Purpose: Shared navigation shell for the Feijoa frontend pages. */
import {
  BarChart3,
  History,
  Home,
  Leaf,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home", icon: Home },
  { to: "/results", label: "Results", icon: BarChart3 },
  { to: "/history", label: "History", icon: History },
];

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-canopy/10 bg-mist/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canopy text-pulp">
              <Leaf size={22} aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-canopy">
                Feijoa Quality
              </h1>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "focus-ring inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-canopy text-white"
                      : "bg-white/70 text-canopy hover:bg-white",
                  ].join(" ")
                }
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
    </div>
  );
}
