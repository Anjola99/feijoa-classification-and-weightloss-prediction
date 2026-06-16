/** Purpose: Image upload page for Model 1 feijoa state classification. */
import { ImagePlus, Loader2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { classifyImage, describeApiError } from "../api/client";
import QualityPredictionPanel from "../components/QualityPredictionPanel";

const tones = {
  unripe: "bg-leaf",
  ripe: "bg-pulp",
  overripe: "bg-ember",
};

export default function Classify() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sortedScores = useMemo(() => {
    if (!result?.scores) return [];
    return Object.entries(result.scores).sort((a, b) => b[1] - a[1]);
  }, [result]);

  const handleFile = (nextFile) => {
    if (!nextFile) return;
    setFile(nextFile);
    setResult(null);
    setError("");
    setPreview(URL.createObjectURL(nextFile));
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await classifyImage(formData);
      setResult(response.data);
    } catch (err) {
      setError(describeApiError(err, "Classification failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="panel p-6">
          <div className="flex items-center gap-3">
            <ImagePlus className="text-leaf" aria-hidden="true" />
            <div>
              <h2 className="mt-1 text-2xl font-semibold text-canopy">
                Fruit state
              </h2>
            </div>
          </div>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleFile(event.dataTransfer.files?.[0]);
            }}
            className="mt-5 flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-canopy/25 bg-white p-6 text-center transition hover:border-leaf hover:bg-leaf/5"
          >
            {preview ? (
              <img
                src={preview}
                alt="Selected feijoa preview"
                className="max-h-64 rounded-md object-contain"
              />
            ) : (
              <>
                <UploadCloud className="text-leaf" size={36} aria-hidden="true" />
                <span className="mt-3 font-semibold text-canopy">Drop or choose an image</span>
                <span className="mt-1 text-sm text-ink/60">JPEG or PNG</span>
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={!file || loading}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-canopy px-4 py-3 font-semibold text-white transition hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <UploadCloud size={18} />}
            Run classification
          </button>
          {error ? <p className="mt-3 text-sm font-medium text-ember">{error}</p> : null}
        </section>

        <section className="panel p-6">
          <h2 className="text-2xl font-semibold text-canopy">Result</h2>
          {result ? (
            <div className="mt-5 space-y-5">
              <div className="rounded-md border border-canopy/10 bg-mist p-5">
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-4xl font-semibold capitalize text-canopy">
                    {result.predicted_state}
                  </p>
                  <p className="text-xl font-semibold text-canopy">
                    {(result.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full ${tones[result.predicted_state] || "bg-leaf"}`}
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-3">
                {sortedScores.map(([label, score]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium capitalize text-canopy">{label}</span>
                      <span className="text-ink/70">{(score * 100).toFixed(2)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-canopy/10">
                      <div
                        className={`h-full ${tones[label] || "bg-leaf"}`}
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-md border border-canopy/10 bg-white p-6 text-sm text-ink/65">
              Waiting for an image prediction.
            </div>
          )}
        </section>
      </div>

      {result ? (
        <QualityPredictionPanel
          title="Storage quality estimate"
          intro={`Model 1 classified this fruit as ${result.predicted_state}. Add the storage and colour measurements for Model 2 to estimate post-harvest quality.`}
        />
      ) : null}
    </div>
  );
}
