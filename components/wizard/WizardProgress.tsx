"use client";

import { Check } from "lucide-react";

interface WizardStep {
    id: string;
    label: string;
    description?: string;
}

interface WizardProgressProps {
    steps: WizardStep[];
    currentStep: number;
    onStepClick?: (stepIndex: number) => void;
    allowNavigation?: boolean;
}

export default function WizardProgress({
    steps,
    currentStep,
    onStepClick,
    allowNavigation = false,
}: WizardProgressProps) {
    const progressPercentage = ((currentStep + 1) / steps.length) * 100;

    return (
        <div className="w-full mb-8">
            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-bone-white/10 rounded-full mb-6 overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                />
            </div>

            {/* Steps */}
            <div className="flex justify-between items-start">
                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isClickable = allowNavigation && (isCompleted || isCurrent);

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center flex-1"
                            style={{ maxWidth: `${100 / steps.length}%` }}
                        >
                            {/* Step Circle */}
                            <button
                                onClick={() => isClickable && onStepClick?.(index)}
                                disabled={!isClickable}
                                className={`
                  relative w-10 h-10 rounded-full border-2 flex items-center justify-center
                  transition-all duration-300 mb-2
                  ${isCompleted
                                        ? "bg-emerald-600 border-emerald-500 text-white"
                                        : isCurrent
                                            ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 scale-110"
                                            : "bg-bone-white/5 border-bone-white/20 text-bone-white/40"
                                    }
                  ${isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"}
                `}
                            >
                                {isCompleted ? (
                                    <Check size={20} strokeWidth={3} />
                                ) : (
                                    <span className="font-mono font-bold text-sm">{index + 1}</span>
                                )}

                                {/* Pulse animation for current step */}
                                {isCurrent && (
                                    <div className="absolute inset-0 rounded-full border-2 border-emerald-500 animate-ping opacity-50" />
                                )}
                            </button>

                            {/* Step Label */}
                            <div className="text-center">
                                <div
                                    className={`
                    text-xs font-mono font-bold mb-1 transition-colors duration-300
                    ${isCurrent ? "text-emerald-400" : isCompleted ? "text-bone-white/70" : "text-bone-white/40"}
                  `}
                                >
                                    {step.label}
                                </div>
                                {step.description && (
                                    <div
                                        className={`
                      text-[10px] text-bone-white/50 max-w-[100px] mx-auto
                      ${isCurrent ? "opacity-100" : "opacity-0"}
                      transition-opacity duration-300
                    `}
                                    >
                                        {step.description}
                                    </div>
                                )}
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`
                    absolute top-5 h-0.5 transition-all duration-500
                    ${index < currentStep ? "bg-emerald-500" : "bg-bone-white/10"}
                  `}
                                    style={{
                                        left: `${((index + 0.5) / steps.length) * 100}%`,
                                        width: `${(1 / steps.length) * 100}%`,
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Counter */}
            <div className="text-center mt-4">
                <span className="text-xs font-mono text-bone-white/50">
                    Step {currentStep + 1} of {steps.length}
                </span>
                <span className="text-xs font-mono text-emerald-400 ml-2">
                    ({Math.round(progressPercentage)}% complete)
                </span>
            </div>
        </div>
    );
}
