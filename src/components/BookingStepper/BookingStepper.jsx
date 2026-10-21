import React from "react";
import { Check, Armchair, UserCheck, CreditCard, ShieldCheck } from "lucide-react";
import "./BookingStepper.css";

const stepIcons = [Armchair, UserCheck, CreditCard, ShieldCheck];

function BookingStepper({ currentStep = 1, onStepClick }) {
  const steps = [
    { number: 1, label: "Select Seats", sub: "Choose your berth" },
    { number: 2, label: "Traveller Details", sub: "Passenger info" },
    { number: 3, label: "Review & Pay", sub: "Instant checkout" },
    { number: 4, label: "Confirmation", sub: "Digital ticket" },
  ];

  return (
    <nav className="luxury-stepper-wrapper" aria-label="Booking Progress">
      <div className="luxury-stepper-track">
        {steps.map((step, idx) => {
          const isActive = step.number === currentStep;
          const isCompleted = step.number < currentStep;
          const isClickable = Boolean(onStepClick);
          const StepIcon = stepIcons[idx] || Armchair;

          return (
            <React.Fragment key={step.number}>
              <div
                className={`luxury-step-node ${isActive ? "is-active" : ""} ${
                  isCompleted ? "is-completed" : ""
                } ${isClickable ? "is-clickable" : ""}`}
                onClick={() => onStepClick && onStepClick(step.number)}
                role={isClickable ? "button" : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onStepClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onStepClick(step.number);
                  }
                }}
                aria-current={isActive ? "step" : undefined}
                title={isClickable ? `Go to Step ${step.number}: ${step.label}` : undefined}
              >
                <div className="luxury-step-badge-wrap">
                  <div className="luxury-step-circle">
                    {isCompleted ? (
                      <Check size={16} className="luxury-check-icon" strokeWidth={3} />
                    ) : (
                      <StepIcon size={16} className="luxury-step-icon" />
                    )}
                  </div>
                  {isActive && <div className="luxury-pulse-halo" />}
                </div>

                <div className="luxury-step-meta">
                  <div className="luxury-step-label-row">
                    <span className="luxury-step-num-pill">Step {step.number}</span>
                    <span className="luxury-step-title">{step.label}</span>
                  </div>
                  <span className="luxury-step-subtitle">{step.sub}</span>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={`luxury-connector-line ${
                    step.number < currentStep ? "is-filled" : ""
                  }`}
                >
                  <div className="luxury-connector-glow" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}

export default BookingStepper;
