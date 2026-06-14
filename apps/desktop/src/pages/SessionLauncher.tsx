import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProjects, getSessions } from '../store/persistence';
import { getResumeTarget, relativeDays } from '../store/resume';
import { selectTestament } from '../store/testament';
import { Wordmark } from '../components/Wordmark';
import type { Project } from '../types';

// Time-of-day greeting, computed once on mount (static — never live). Empty
// string means no greeting; the Ember lockup is always the brand element.
function timeGreeting(): string {
  const h = new Date().getHours();
  if (h >= 21) return 'THE LATE SHIFT';
  if (h < 7) return 'FIRST LIGHT';
  return '';
}

function activityMs(p: Project): number {
  return new Date(p.lastActivityAt || p.updatedAt).getTime();
}

const displayLine: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 500,
  fontSize: 28,
  letterSpacing: '-0.01em',
  color: 'var(--text-hi)',
};

const testamentStyle: React.CSSProperties = {
  color: 'var(--text-mid)',
  fontFamily: 'var(--font-ui)',
  fontSize: 14,
};

// The testament line (J3): quiet text, numbers in Courier Prime (the typewriter
// motif). Static — computed once at mount, never animated or auto-rotated.
function TestamentText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d[\d,]*)/g).map((part, i) =>
        /^\d[\d,]*$/.test(part) ? (
          <span key={i} style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-hi)' }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SessionLauncher() {
  const navigate = useNavigate();
  const [greeting] = useState(timeGreeting);
  // Computed once at mount: static line, may differ between visits, never rotates.
  const [testament] = useState(() => selectTestament(getSessions(), Date.now()));
  const resume = getResumeTarget();
  const projects = getProjects();
  const startRef = useRef<HTMLAnchorElement>(null);

  // First run: focus "Start writing" so Enter starts a sprint.
  useEffect(() => {
    if (!resume) startRef.current?.focus();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // First-run hero: one brass, one ghost, one line of invitation. Nothing else.
  if (!resume) {
    return (
      <div className="page" style={{ maxWidth: 480, paddingTop: '5rem', textAlign: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          {greeting && <div className="eyebrow" style={{ marginBottom: 8 }}>{greeting}</div>}
          <Wordmark size={28} />
        </div>
        <h1 style={{ ...displayLine, marginBottom: 12 }}>The page is ready when you are.</h1>
        <p className="testament-line" style={{ ...testamentStyle, marginBottom: 32 }}>
          <TestamentText text={testament.text} />
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 280, margin: '0 auto' }}>
          <Link ref={startRef} to="/sprint" className="btn-brass">Start writing</Link>
          <Link to="/project/new" className="btn-ghost">Plan a project</Link>
        </div>
      </div>
    );
  }

  // Returning hero: the Resume card, then quiet recent rows.
  const others = projects
    .filter(p => p.id !== resume.project.id)
    .sort((a, b) => activityMs(b) - activityMs(a))
    .slice(0, 4);

  return (
    <div className="page" style={{ maxWidth: 480, paddingTop: '4rem' }}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        {greeting && <div className="eyebrow" style={{ marginBottom: 8 }}>{greeting}</div>}
        <Wordmark size={28} />
      </div>
      <h1 style={{ ...displayLine, textAlign: 'center', marginBottom: 12 }}>The page is ready when you are.</h1>
      <p className="testament-line" style={{ ...testamentStyle, textAlign: 'center', marginBottom: 32 }}>
        <TestamentText text={testament.text} />
      </p>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>{resume.project.title}</div>
        {resume.lastLine ? (
          <div
            style={{
              background: 'var(--paper-dim)', color: 'var(--ink-on-paper)',
              borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              fontFamily: 'var(--font-prose)', fontStyle: 'italic', fontSize: 17,
              lineHeight: 1.6, marginBottom: 12,
            }}
          >
            {resume.lastLine}
          </div>
        ) : (
          <div style={{ color: 'var(--text-mid)', marginBottom: 12 }}>Pick up where you left off.</div>
        )}
        <div style={{ color: 'var(--text-mid)', fontSize: 13, marginBottom: 16 }}>
          Last touched {relativeDays(resume.daysAgo)}
          {resume.label ? ` · Next: ${resume.label}` : ''}
        </div>
        <Link to={resume.route} className="btn-brass">Resume</Link>
      </div>

      {others.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          {others.map(p => (
            <Link
              key={p.id}
              to={`/project/${p.id}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '10px 4px', textDecoration: 'none',
                borderBottom: '1px solid var(--ink-border)',
              }}
            >
              <span style={{ color: 'var(--text-hi)' }}>{p.title}</span>
              <span style={{ color: 'var(--text-low)', fontSize: 13 }}>
                {relativeDays(Math.max(0, Math.floor((Date.now() - activityMs(p)) / 86_400_000)))}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <button type="button" className="btn-quiet" onClick={() => navigate('/sprint')}>Start a new sprint</button>
        <button type="button" className="btn-quiet" onClick={() => navigate('/project/new')}>Plan a project</button>
      </div>
    </div>
  );
}
