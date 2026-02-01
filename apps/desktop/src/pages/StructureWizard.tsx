import { useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { getProject, createStoryPlan } from '../store/persistence';
import { recommendFrameworks, getAllFrameworks, getFramework } from '../store/frameworks';
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
      <Link to={`/project/${id}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block' }}>
        &larr; Back to Project
      </Link>

      <h1 className="page-title">Structure Wizard</h1>
      <p className="page-subtitle">
        {step === 'questions' && `Question ${currentQuestion + 1} of ${questions.length}`}
        {step === 'recommendation' && 'Our Recommendation'}
        {step === 'selection' && 'Confirm Your Choice'}
      </p>

      {step === 'questions' && (
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{question.question}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {question.options.map(option => (
              <button
                key={option.value}
                className="card"
                onClick={() => handleAnswer(question.id, option.value)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderColor: answers[question.id] === option.value ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <div className="card-title">{option.label}</div>
                <div className="card-description">{option.description}</div>
              </button>
            ))}
          </div>
          {currentQuestion > 0 && (
            <button className="btn btn-secondary" onClick={handleBack} style={{ marginTop: '1.5rem' }}>
              Previous Question
            </button>
          )}
        </div>
      )}

      {step === 'recommendation' && recommendation && (
        <div>
          <div className="card" style={{ borderColor: 'var(--color-primary)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="tag" style={{ backgroundColor: 'var(--color-primary)', marginBottom: '0.5rem' }}>Recommended</span>
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
              className="btn btn-primary"
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
              className="btn btn-secondary"
              onClick={() => handleSelectFramework(recommendation.alternate)}
              style={{ marginTop: '1rem' }}
            >
              Choose {recommendation.alternate.name}
            </button>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Or choose another framework:</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {allFrameworks
                .filter(f => f.id !== recommendation.primary.id && f.id !== recommendation.alternate.id)
                .map(framework => (
                  <button
                    key={framework.id}
                    className="btn btn-secondary"
                    onClick={() => handleSelectFramework(framework)}
                    style={{ fontSize: '0.875rem' }}
                  >
                    {framework.name}
                  </button>
                ))}
            </div>
          </div>

          <button className="btn btn-secondary" onClick={handleBack} style={{ marginTop: '2rem' }}>
            Back to Questions
          </button>
        </div>
      )}

      {step === 'selection' && selectedFramework && (
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>{selectedFramework.name}</div>
            <div className="card-description" style={{ marginBottom: '1rem' }}>{selectedFramework.description}</div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Beats in this framework:</h3>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Preview only — you’ll choose beats in the Structure Board.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {selectedFramework.beats.map((beat, index) => (
                <div
                  key={beat.id}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    cursor: 'default',
                  }}
                >
                  <span style={{ color: 'var(--color-text-muted)', marginRight: '0.5rem' }}>{index + 1}.</span>
                  {beat.name}
                </div>
              ))}
            </div>
          </div>

          <div className="button-group">
            <button className="btn btn-primary" onClick={handleConfirm}>
              Start Writing with {selectedFramework.name}
            </button>
            <button className="btn btn-secondary" onClick={handleBack}>
              Choose Different Framework
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
