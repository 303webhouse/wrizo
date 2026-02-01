# Stage 2 Roadmap (spec-only)

## Guardrails (never break)
- Default path must always be momentum-first: Next Action -> Draft/Sprint.
- Planning/customization must be opt-in and timeboxed.
- Academic mode must never generate usable draft sentences.
- Creative mode: no prose generation by default.

## S2-ADV  Advanced Structure Customization (opt-in)
Goal: Let experienced writers tailor structure without becoming a planning side quest.

v1 (safe):
- Rename beats (labels only)
- Add sub-beats as bullets (fragments only)
- Pin next beat (override auto-advance)
- Per-beat checklists (e.g., stakes / turn / goal)

Guardrails:
- Timebox: after 10 min in Advanced, prompt Draft sprint?
- One-click Return to Next Beat
- Default launch returns to drafting unless user explicitly chooses Advanced

v2 (higher risk):
- Reorder beats
- Custom framework builder
- Import/export frameworks JSON

## S2-ACA  Academic Mode foundations
- Project type: Academic enabled
- Sources manager: add PDFs/URLs/text, tag sources
- Citation automation: APA/MLA/Chicago (formatting only)
- AP style: linter/checklist (not citations)

## S2-INT  Attribution Guard (anti-plagiarism nudges)
- Scan user text against linked sources
- Flag patchwriting / missing attribution
- Provide coaching prompts (questions + blanks), not rewritten sentences

## S2-AI  Tutor/editor collaboration layer (authorship-first)
- AI can ask questions, diagnose issues, propose outlines, offer templates with blanks
- AI cannot produce usable draft sentences (academic); creative remains constrained

## S2-PLATFORM  Social layer (later)
- Feedback requests
- Collaboration matching
- Versioned sharing
(Explicitly not in Stage 2 unless core product pull is proven.)
