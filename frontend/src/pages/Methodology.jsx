/** Purpose: In-app methodology summary for the two Feijoa ML models. */
import { Cpu, FileBarChart, Image as ImageIcon } from "lucide-react";

const blocks = [
  {
    title: "Model 1: Fruit State Classification",
    icon: ImageIcon,
    body:
      "Model 1 classifies feijoa images into unripe, ripe, and overripe. SigLIP was used only once during dataset auto-labelling and is not loaded by this app.",
  },
  {
    title: "Model 2: Quality Parameter Prediction",
    icon: Cpu,
    body:
      "Model 2 predicts weight loss, WVTR, O2, CO2, RH, and firmness from time, temperature, perforations, a*, b*, and L*.",
  },
  {
    title: "Evaluation",
    icon: FileBarChart,
    body:
      "The retrained classifier reached 0.900990 test accuracy and 0.901290 macro F1. The regressor passed the R2 threshold for every target, with all held-out R2 values above 0.99.",
  },
];

export default function Methodology() {
  return (
    <div className="space-y-6">
      <section className="panel p-6">
        <h2 className="text-2xl font-semibold text-canopy">Methodology</h2>
        <p className="mt-3 max-w-4xl leading-7 text-ink/75">
          The system combines visual maturity classification with tabular
          post-harvest quality regression for feijoa fruit stored under perforated
          modified atmosphere packaging.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {blocks.map(({ title, icon: Icon, body }) => (
            <article key={title} className="rounded-md border border-canopy/10 bg-white p-5">
              <Icon className="text-leaf" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-canopy">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink/70">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <figure className="panel p-4">
          <img
            src="/model-assets/confusion_matrix.png"
            alt="Model 1 confusion matrix"
            className="w-full rounded-md"
          />
          <figcaption className="mt-3 text-sm font-medium text-canopy">
            Model 1 confusion matrix
          </figcaption>
        </figure>
        <figure className="panel p-4">
          <img
            src="/model-assets/training_curves.png"
            alt="Model 1 training curves"
            className="w-full rounded-md"
          />
          <figcaption className="mt-3 text-sm font-medium text-canopy">
            MobileNetV2 training curves
          </figcaption>
        </figure>
        <figure className="panel p-4">
          <img
            src="/model-assets/feature_importance.png"
            alt="Model 2 feature importance"
            className="w-full rounded-md"
          />
          <figcaption className="mt-3 text-sm font-medium text-canopy">
            Random Forest feature importance
          </figcaption>
        </figure>
      </section>
    </div>
  );
}
