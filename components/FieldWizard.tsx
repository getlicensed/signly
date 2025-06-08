import React, { useState } from "react";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import PDFSigner from "./PDFSigner";

interface FieldWizardProps {
  pdf: pdfjsLib.PDFDocumentProxy;
}

type FieldType = "signature" | "name" | "date" | "initials";
interface SignatureField {
  x: number;
  y: number;
  page: number;
  id: string;
  type: FieldType;
}

const steps = [
  { label: "Add Your Fields" },
  { label: "Preview" },
  { label: "Send & Manage" }
];

const FieldWizard: React.FC<FieldWizardProps> = ({ pdf }) => {
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<SignatureField[]>([]);

  if (!pdf) return null;

  const handleBack = () => setStep(s => Math.max(0, s - 1));
  const handleNext = () => setStep(s => Math.min(steps.length - 1, s + 1));

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-blue-50 to-white">
      {/* Stepper UI (not sticky) */}
      <div className="w-full flex justify-center items-center py-6 bg-white -md z-10 mb-4">
        {steps.map((stepObj, idx) => (
          <React.Fragment key={stepObj.label}>
            <div className={`flex flex-col items-center ${step === idx ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 -full flex items-center justify-center border-2 ${step === idx ? 'border-blue-600 bg-blue-100' : 'border-gray-300 bg-white'}`}>{idx + 1}</div>
              <div className="mt-2 text-xs text-center w-24">{stepObj.label}</div>
            </div>
            {idx < steps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-2 " />}
          </React.Fragment>
        ))}
      </div>

      {/* Step content, center-aligned, with bottom margin for nav bar */}
      <div className="flex-1 flex flex-col items-center justify-center w-full" style={{ marginBottom: 100 }}>
        <div className="p-6 flex flex-col items-center min-h-[600px] w-full max-w-5xl">
          {step === 0 && (
            <PDFSigner
              pdf={pdf}
              fields={fields}
              setFields={setFields}
              readOnly={false}
            />
          )}
          {step === 1 && (
            <PDFSigner
              pdf={pdf}
              fields={fields}
              setFields={setFields}
              readOnly={true}
            />
          )}
          {step === 2 && (
            <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
              <h2 className="text-2xl font-bold mb-4 text-blue-700">Send & Manage</h2>
              <p className="text-gray-500 mb-2">This is a placeholder for sending, link generation, and management features.</p>
              <button className="mt-4 px-6 py-3 bg-blue-600 text-white   hover:bg-blue-700">Coming Soon</button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed navigation bar at bottom */}
      <div className="fixed bottom-0 left-0 w-full bg-white -lg flex justify-center items-center py-5 z-50" style={{ borderTop: '1px solid #e5e7eb' }}>
        <div className="w-full max-w-5xl flex justify-between px-8">
          <button
            className="px-8 py-3 -lg bg-gray-200 text-gray-700 font-bold text-lg  disabled:opacity-50 transition"
            onClick={handleBack}
            disabled={step === 0}
          >
            Back
          </button>
          <button
            className="px-8 py-3 -lg bg-blue-600 text-white font-bold text-lg  disabled:opacity-50 transition"
            onClick={handleNext}
            disabled={step === steps.length - 1}
          >
            {step === steps.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldWizard;
