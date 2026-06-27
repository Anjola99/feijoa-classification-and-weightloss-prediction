/** Purpose: Prediction history table for classifier and regressor records. */
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { getPredictionHistory } from "../api/client";

export default function History() {
  const [model, setModel] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ total: 0, predictions: [] });
  const [loading, setLoading] = useState(false);
  const limit = 50;

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await getPredictionHistory({
        limit,
        offset: page * limit,
        ...(model ? { model } : {}),
      });
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, page]);

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-canopy/10 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-canopy">Prediction history</h2>
          <p className="mt-1 text-sm text-ink/60">{data.total} saved predictions</p>
        </div>
        <div className="flex gap-2">
          <select
            value={model}
            onChange={(event) => {
              setPage(0);
              setModel(event.target.value);
            }}
            className="focus-ring rounded-md border border-canopy/15 bg-white px-3 py-2 text-sm"
          >
            <option value="">All models</option>
            <option value="classifier">Classifier</option>
            <option value="regressor">Regressor</option>
          </select>
          <button
            type="button"
            onClick={loadHistory}
            className="focus-ring inline-flex items-center gap-2 rounded-md bg-canopy px-3 py-2 text-sm font-semibold text-white"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-canopy text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Model</th>
              <th className="px-4 py-3 font-semibold">Input</th>
              <th className="px-4 py-3 font-semibold">Result</th>
            </tr>
          </thead>
          <tbody>
            {data.predictions.map((item) => (
              <tr key={item.id} className="border-b border-canopy/10 bg-white align-top">
                <td className="px-4 py-3 text-ink/70">
                  {new Date(item.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-semibold capitalize text-canopy">{item.model}</td>
                <td className="px-4 py-3 text-ink/70">{item.input_summary}</td>
                <td className="px-4 py-3">
                  <pre className="max-w-xl whitespace-pre-wrap rounded-md bg-mist p-3 text-xs text-ink/75">
                    {JSON.stringify(item.result, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
            {!data.predictions.length ? (
              <tr>
                <td colSpan="4" className="bg-white px-4 py-10 text-center text-ink/60">
                  No predictions saved yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-canopy/10 bg-white px-6 py-4">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => setPage((value) => Math.max(0, value - 1))}
          className="focus-ring rounded-md bg-mist px-3 py-2 text-sm font-semibold text-canopy disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-ink/60">Page {page + 1}</span>
        <button
          type="button"
          disabled={(page + 1) * limit >= data.total}
          onClick={() => setPage((value) => value + 1)}
          className="focus-ring rounded-md bg-mist px-3 py-2 text-sm font-semibold text-canopy disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
