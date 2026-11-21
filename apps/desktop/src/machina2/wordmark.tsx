// MACHINA'S MARK IS WRIZO (Nick, Nov 21, via Fable 1:30 pm: "the logo in the top left corner was made for the mockup"; the mockup's mark,
// cursor/reorg-prototype docs/mockups/reorg/reorg.css 45-52, NOT-RULED.md 26/40). Five letters, Plex Sans 500 at 13 px, .26em apart, the left
// padding making up the spacing after the last letter, and one brass notch under the O, 6 x 2 px, centred on the O's inked middle: the O is its
// own box with no spacing after it (the spacing moves to its right margin), so the box is the glyph's own advance and its middle is the O's (Plex
// Sans's O sits evenly in its advance). No line above, below or beside it. Drawn by the corner mark (App.tsx's BrandMark) and the bar's nameplate
// (./nameplate.tsx) under Machina's look; styles in machina-v2.css ("THE MARK IS WRIZO"). Checked by scripts/harness/machina-logo-wrizo.mjs.
export function MachinaWordmark() {
  return (
    <span className="machina2-wm">WRIZ<span className="machina2-wm-o">O<i className="machina2-wm-notch" /></span></span>
  );
}
