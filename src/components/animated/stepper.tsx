'use client';

import React, { useState, useRef, useLayoutEffect, ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';

interface StepperProps {
  children: ReactNode[];
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  className?: string;
  backText?: string;
  nextText?: string;
  completeText?: string;
  accentColor?: string;
  hideControls?: boolean;
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: '0%',
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-50%' : '50%',
    opacity: 0,
  }),
};

export function Stepper({
  children,
  currentStep: controlledStep,
  onStepChange,
  onComplete,
  className = '',
  backText = 'Back',
  nextText = 'Next',
  completeText = 'Complete',
  accentColor = '#3b82f6',
  hideControls = false,
}: StepperProps) {
  const [internalStep, setInternalStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = controlledStep ?? internalStep;
  const totalSteps = children.length;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    if (controlledStep === undefined) {
      setInternalStep(newStep);
    }
    if (newStep > totalSteps) {
      setIsCompleted(true);
      onComplete?.();
    } else {
      onStepChange?.(newStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };

  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className={`mx-auto w-full max-w-lg ${className}`}>
      <div className="rounded-2xl border border-white/[0.08] bg-slate-900/80 backdrop-blur-sm">
        {/* Step indicators */}
        <div className="flex w-full items-center p-6">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const stepNum = index + 1;
            const status =
              currentStep === stepNum
                ? 'active'
                : currentStep > stepNum
                  ? 'complete'
                  : 'inactive';

            return (
              <React.Fragment key={stepNum}>
                <motion.div
                  className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold cursor-pointer"
                  animate={{
                    backgroundColor:
                      status === 'inactive'
                        ? 'rgba(30, 41, 59, 1)'
                        : accentColor,
                    color:
                      status === 'inactive'
                        ? 'rgba(148, 163, 184, 1)'
                        : 'rgba(255, 255, 255, 1)',
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => {
                    if (stepNum !== currentStep) {
                      setDirection(stepNum > currentStep ? 1 : -1);
                      updateStep(stepNum);
                    }
                  }}
                >
                  {status === 'complete' ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : status === 'active' ? (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </motion.div>

                {index < totalSteps - 1 && (
                  <div className="relative mx-2 h-0.5 flex-1 overflow-hidden rounded bg-slate-700">
                    <motion.div
                      className="absolute left-0 top-0 h-full"
                      style={{ backgroundColor: accentColor }}
                      initial={false}
                      animate={{
                        width: currentStep > stepNum ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Step content */}
        <motion.div
          className="relative overflow-hidden"
          animate={{ height: isCompleted ? 0 : 'auto' }}
          transition={{ type: 'spring', duration: 0.4 }}
        >
          <AnimatePresence initial={false} mode="wait" custom={direction}>
            {!isCompleted && (
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="px-6"
              >
                {children[currentStep - 1]}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation buttons */}
        {!isCompleted && !hideControls && (
          <div className="px-6 pb-6">
            <div
              className={`mt-6 flex ${currentStep !== 1 ? 'justify-between' : 'justify-end'}`}
            >
              {currentStep !== 1 && (
                <button
                  onClick={handleBack}
                  className="rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:text-white"
                >
                  {backText}
                </button>
              )}
              <button
                onClick={isLastStep ? handleComplete : handleNext}
                className="rounded-full px-5 py-2 text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: accentColor }}
              >
                {isLastStep ? completeText : nextText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Stepper;
