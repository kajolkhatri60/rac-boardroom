import React from 'react';
import { Check } from 'lucide-react';

export default function Stepper({
  steps = [],
  currentStep = 1,
  className = '',
}) {
  return (
    <nav aria-label="Application progress" className={`w-full py-4 ${className}`}>
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <li
              key={step.id || idx}
              className={`flex-1 flex items-center ${
                idx < steps.length - 1 ? 'after:content-[""] after:w-full after:h-px after:border-b after:border-rule after:inline-block after:mx-3' : ''
              }`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center gap-2.5 shrink-0">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums select-none ${
                    isCompleted
                      ? 'bg-ok-bg text-ok border border-ok/30'
                      : isCurrent
                      ? 'bg-ink text-white'
                      : 'bg-desk text-muted border border-rule'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    stepNumber
                  )}
                </span>
                <span
                  className={`text-sm hidden sm:inline ${
                    isCurrent
                      ? 'font-semibold text-text'
                      : isCompleted
                      ? 'font-medium text-text'
                      : 'font-normal text-muted'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
