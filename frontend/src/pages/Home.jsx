/** Purpose: Minimal home entry point for the Feijoa frontend. */
import { BarChart3, History } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="panel bg-canopy p-6 text-white">
        <h2 className="text-3xl font-semibold">Feijoa Quality</h2>
        <p className="mt-3 text-pulp">Classify fruit state and predict storage quality.</p>
      </section>

      <div className="grid gap-4">
        <Link
          to="/results"
          className="focus-ring flex items-center justify-between rounded-md border border-canopy/10 bg-white p-5 text-canopy transition hover:-translate-y-0.5 hover:shadow-soft"
        >
          <span className="flex items-center gap-3 font-semibold">
            <BarChart3 size={20} aria-hidden="true" />
            Results
          </span>
        </Link>
        <Link
          to="/history"
          className="focus-ring flex items-center justify-between rounded-md border border-canopy/10 bg-white p-5 text-canopy transition hover:-translate-y-0.5 hover:shadow-soft"
        >
          <span className="flex items-center gap-3 font-semibold">
            <History size={20} aria-hidden="true" />
            History
          </span>
        </Link>
      </div>
    </div>
  );
}
