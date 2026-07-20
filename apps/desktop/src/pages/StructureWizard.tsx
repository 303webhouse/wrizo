import { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, createStoryPlan } from '../store/persistence';
import { recommendFrameworks, getAllFrameworks, getFramework } from '../store/frameworks';
import { useDeskLexicon } from '../store/deskLexicon';
import type { WizardAnswers, Framework } from '../types';

interface Question {
  id: keyof WizardAnswers;
  question: string;
  options: { value: string; label: string; description: string }[];
}

const questions: Question[] = [
  {
    id: 'genre',
    question: 'What genre best describes your story?',
    options: [
      { value: 'action', label: 'Action/Thriller', description: 'Fast-paced, tension-driven narratives' },
      { value: 'drama', label: 'Drama', description: 'Character-focused emotional journeys' },
      { value: 'fantasy', label: 'Fantasy/Sci-Fi', description: 'World-building and speculative fiction' },
      { value: 'literary', label: 'Literary Fiction', description: 'Emphasis on prose and theme' },
    ],
  },
  {
    id: 'length',
    question: 'What format are you writing?',
    options: [
      { value: 'short', label: 'Short Story', description: 'Under 15,000 words' },
      { value: 'novel', label: 'Novel/Novella', description: '15,000+ words' },
      { value: 'screenplay', label: 'Screenplay', description: 'Film or TV format' },
    ],
  },
  {
    id: 'characterFocus',
    question: 'What drives your story?',
    options: [
      { value: 'transformation', label: 'Character Transformation', description: 'Focus on internal change and growth' },
      { value: 'external', label: 'External Conflict', description: 'Focus on plot and external obstacles' },
    ],
  },
  {
    id: 'pacing',
    question: 'What pacing do you envision?',
    options: [
      { value: 'fast', label: 'Fast-Paced', description: 'Quick beats, constant momentum' },
      { value: 'measured', label: 'Measured', description: 'Room for reflection and development' },
    ],
  },
];

type WizardStep = 'questions' | 'recommendation' | 'selection';

export function StructureWizard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useDeskLexicon();
  const project = id ? getProject(id) : null;

  const [step, setStep] = useState<WizardStep>('questions');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({});
  const [recommendation, setRecommendation] = useState<{ primary: Framework; alternate: Framework } | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);

  if (!project) {
    return <Navigate to="/" replace />;
  }

  const handleAnswer = (questionId: keyof WizardAnswers, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const rec = recommendFrameworks(newAnswers);
      setRecommendation(rec);
      setStep('recommendation');
    }
  };

  const handleSelectFramework = (framework: Framework) => {
    setSelectedFramework(framework);
    setStep('selection');
  };

  const handleConfirm = () => {
    if (!selectedFramework || !id) return;

    const beatIds = selectedFramework.beats.map(b => b.id);
    createStoryPlan(id, selectedFramework.id, beatIds);
    navigate(`/project/${id}/beat`);
  };

  const handleBack = () => {
    if (step === 'questions' && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (step === 'recommendation') {
      setStep('questions');
    } else if (step === 'selection') {
      setStep('recommendation');
    }
  };

  const allFrameworks = getAllFrameworks();
  const question = questions[currentQuestion];

  return (
    <div className="page">
      <Link to={`/project/${id}`} className="btn-quiet" style={{ display: 'inline-block', marginBottom: '1rem', paddingLeft: 0 }}>
        &larr; {t('backToDrawer')}
      </Link>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Structure wizard</div>
      <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>
        {step === 'questions' && 'A few quick questions'}
        {step === 'recommendation' && "The librarian's pick"}
        {step === 'selection' && 'Confirm your choice'}
      </h1>

      {step === 'questions' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
            {questions.map((q, i) => (
              <span
                key={q.id}
                className={`status-dot ${i < currentQuestion ? 'status-dot--done' : i === currentQuestion ? 'status-dot--started' : 'status-dot--empty'}`}
                aria-label={`question ${i + 1} of ${questions.length}`}
              />
            ))}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.4rem', marginBottom: '1.5rem' }}>
            {question.question}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {question.options.map(option => {
              const selected = answers[question.id] === option.value;
              return (
                <button
                  key={option.value}
                  className="card"
                  onClick={() => handleAnswer(question.id, option.value)}
                  style={{
                    cursor: 'pointer', textAlign: 'left', width: '100%', marginBottom: 0,
                    borderColor: selected ? 'var(--brass)' : 'var(--ink-border)',
                    borderLeft: selected ? '3px solid var(--brass)' : '1px solid var(--ink-border)',
                  }}
                >
                  <div className="card-title">{option.label}</div>
                  <div className="card-description">{option.description}</div>
                </button>
              );
            })}
          </div>
          {currentQuestion > 0 && (
            <button className="btn-quiet" onClick={handleBack} style={{ marginTop: '1.5rem' }}>
              &larr; Previous question
            </button>
          )}
        </div>
      )}

      {step === 'recommendation' && recommendation && (
        <div>
          <div className="card" style={{ borderLeft: '3px solid var(--brass)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="eyebrow">The librarian&rsquo;s pick</span>
                <div className="card-title" style={{ marginTop: '0.5rem' }}>{recommendation.primary.name}</div>
                <div className="card-description">{recommendation.primary.description}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  {recommendation.primary.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {recommendation.primary.beats.length} beats
                </div>
              </div>
            </div>
            <button
              className="btn-brass"
              onClick={() => handleSelectFramework(recommendation.primary)}
              style={{ marginTop: '1rem' }}
            >
              Choose {recommendation.primary.name}
            </button>
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="tag">Alternative</span>
                <div className="card-title" style={{ marginTop: '0.5rem' }}>{recommendation.alternate.name}</div>
                <div className="card-description">{recommendation.alternate.description}</div>
                <div style={{ marginTop: '0.5rem' }}>
                  {recommendation.alternate.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div style={{ marginTop: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  {recommendation.alternate.beats.length} beats
                </div>
              </div>
            </div>
            <button
              className="btn-ghost"
              onClick={() => handleSelectFramework(recommendation.alternate)}
              style={{ marginTop: '1rem' }}
            >
              Choose {recommendation.alternate.name}
            </button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>See all frameworks</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {allFrameworks
                .filter(f => f.id !== recommendation.primary.id && f.id !== recommendation.alternate.id)
                .map(framework => (
                  <button
                    key={framework.id}
                    className="btn-quiet"
                    onClick={() => handleSelectFramework(framework)}
                  >
                    {framework.name}
                  </button>
                ))}
            </div>
          </div>

          <button className="btn-quiet" onClick={handleBack} style={{ marginTop: '2rem', paddingLeft: 0 }}>
            &larr; Back to questions
          </button>
        </div>
      )}

      {step === 'selection' && selectedFramework && (
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>{selectedFramework.name}</div>
            <div className="card-description" style={{ marginBottom: '1rem' }}>{selectedFramework.description}</div>

            <div className="eyebrow" style={{ marginBottom: '0.75rem' }}>Preview — you&rsquo;ll fill these in next</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--ink-800)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-4)' }}>
              {selectedFramework.beats.map((beat, index) => (
                <div key={beat.id} style={{ fontSize: '0.9rem', color: 'var(--text-mid)' }}>
                  <span style={{ color: 'var(--text-low)', marginRight: '0.5rem', fontFamily: 'var(--font-mono)' }}>{index + 1}.</span>
                  {beat.name}
                </div>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button className="btn-brass" onClick={handleConfirm}>
              Start writing with {selectedFramework.name}
            </button>
            <button className="btn-quiet" onClick={handleBack}>
              Choose a different framework
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
