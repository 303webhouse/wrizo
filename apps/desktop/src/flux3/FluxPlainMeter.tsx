// GLITCH v2 - THE PLAIN METER (the flourish spec §1.5 and §7): with Flux's flourish off, or Distraction Free, the lane carries a 4 px bar and no glitches at all. The same lap the CHECKPOINT meter drew.
export function FluxPlainMeter({ frac, celebrating, label, pageCount }: { frac: number; celebrating: boolean; label: string; pageCount?: React.ReactNode }) {
  const pct = Math.round((celebrating ? 1 : Math.max(0, Math.min(1, frac))) * 100);
  return (
    <div className="flux3-plainmeter" data-plain-meter="">
      <span className="flux3-plainmeter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i className="flux3-plainmeter-fill" style={{ width: pct + '%' }} /></span>
      {pageCount}
    </div>
  );
}
