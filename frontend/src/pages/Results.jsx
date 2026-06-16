/** Purpose: Unified tab for Model 1 and Model 2 prediction results. */
import Classify from "./Classify";
import Predict from "./Predict";

export default function Results() {
  return (
    <div className="space-y-6">
      <Classify />
      <Predict />
    </div>
  );
}
