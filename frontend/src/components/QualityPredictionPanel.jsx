/** Purpose: Shared Model 2 quality prediction form and curve display. */
import { Loader2, ThermometerSun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { describeApiError, getQualityCurve, predictQuality } from "../api/client";
import MetricCard from "./MetricCard";

const initialForm = {
  time_days: 14,
  temperature: 12,
  perforations: 2,
  a_star: -1.2,
  b_star: 16.5,
  lightness_L: 69.3,
};

const fields = [
  { key: "time_days", label: "Storage days", min: 0, max: 35, step: 1 },
  { key: "temperature", label: "Temperature", min: 6, max: 17, step: 1 },
  { key: "perforations", label: "Perforations", min: 0, max: 3, step: 1 },
  { key: "a_star", label: "a*", min: -15, max: 15, step: 0.1 },
  { key: "b_star", label: "b*", min: 0, max: 35, step: 0.1 },
  { key: "lightness_L", label: "Lightness L*", min: 40, max: 85, step: 0.1 },
];

const resultLabels = [
  ["weight_loss_pct", "Weight loss", "%", "ember"],
  ["wvtr_g_m2_day", "WVTR", "g/m2/day", "neutral"],
  ["o2_pct", "O2", "%", "leaf"],
  ["co2_pct", "CO2", "%", "pulp"],
  ["rh_pct", "RH", "%", "neutral"],
  ["firmness_N", "Firmness", "N", "leaf"],
];

export default function QualityPredictionPanel({
  autoRun = false,
  intro = "",
  title = "Quality prediction",
}) {
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [curve, setCurve] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: Number(value) }));
  };

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const [predictionResponse, curveResponse] = await Promise.all([
        predictQuality(form),
        getQualityCurve({
          temperature: form.temperature,
          perforations: form.perforations,
          a_star: form.a_star,
          b_star: form.b_star,
          lightness_L: form.lightness_L,
        }),
      ]);
      setResult(predictionResponse.data);
      setCurve(curveResponse.data);
    } catch (err) {
      setError(describeApiError(err, "Quality prediction failed."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoRun) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun]);

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <section className="panel p-6">
        <div className="flex items-center gap-3">
          <ThermometerSun className="text-leaf" aria-hidden="true" />
          <div>
            <h2 className="mt-1 text-2xl font-semibold text-canopy">{title}</h2>
          </div>
        </div>
        {intro ? <p className="mt-3 text-sm leading-6 text-ink/70">{intro}</p> : null}
        <div className="mt-5 space-y-4">
          {fields.map((field) => (
            <label key={field.key} className="block">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-canopy">{field.label}</span>
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={form[field.key]}
                  onChange={(event) => updateField(field.key, event.target.value)}
                  className="focus-ring w-28 rounded-md border border-canopy/15 bg-white px-2 py-1 text-right"
                />
              </div>
              <input
                type="range"
                min={field.min}
                max={field.max}
                step={field.step}
                value={form[field.key]}
                onChange={(event) => updateField(field.key, event.target.value)}
                className="w-full accent-leaf"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="focus-ring mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-canopy px-4 py-3 font-semibold text-white transition hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ThermometerSun size={18} />}
          Predict quality
        </button>
        {error ? <p className="mt-3 text-sm font-medium text-ember">{error}</p> : null}
      </section>

      <section className="space-y-6">
        <div className="panel p-6">
          <h2 className="text-2xl font-semibold text-canopy">Quality values</h2>
          {result ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultLabels.map(([key, label, unit, tone]) => (
                <MetricCard
                  key={key}
                  label={label}
                  value={Number(result[key]).toFixed(3)}
                  unit={unit}
                  tone={tone}
                />
              ))}
            </div>
          ) : (
            <p className="mt-5 rounded-md border border-canopy/10 bg-white p-6 text-sm text-ink/65">
              Waiting for quality prediction.
            </p>
          )}
        </div>

        <div className="panel p-6">
          <h2 className="text-2xl font-semibold text-canopy">35-day quality curve</h2>
          <div className="mt-5 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 10, right: 22, left: 0, bottom: 12 }}>
                <CartesianGrid stroke="#d9e4d5" strokeDasharray="3 3" />
                <XAxis dataKey="time_days" tick={{ fill: "#173f35", fontSize: 12 }} />
                <YAxis tick={{ fill: "#173f35", fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight_loss_pct" stroke="#c75a3a" dot={false} />
                <Line type="monotone" dataKey="wvtr_g_m2_day" stroke="#6b7c59" dot={false} />
                <Line type="monotone" dataKey="o2_pct" stroke="#2f7d55" dot={false} />
                <Line type="monotone" dataKey="co2_pct" stroke="#d1a935" dot={false} />
                <Line type="monotone" dataKey="rh_pct" stroke="#2d6f91" dot={false} />
                <Line type="monotone" dataKey="firmness_N" stroke="#173f35" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
