"use client";

import { useState, type FormEvent } from "react";
import { Button } from "./Button";

interface LeadFormModalProps {
  vehicleLabel: string;
  ctaType: "price" | "test_drive" | "financing";
  onClose: () => void;
}

const TITLES: Record<string, string> = {
  price: "Get Your Best Price",
  test_drive: "Schedule a Test Drive",
  financing: "Apply for Financing",
};

export function LeadFormModal({ vehicleLabel, ctaType, onClose }: LeadFormModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim()) return;
    // In production this would POST to a CRM webhook
    console.log("[LeadCapture]", { ctaType, vehicleLabel, firstName, email, phone });
    setSubmitted(true);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[#171717] border border-white/10 rounded-sm w-full max-w-md p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {submitted ? (
            /* Success state */
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-green-400">
                  <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">Request Submitted</h3>
              <p className="text-white/50 text-sm mb-1">
                A dealer specialist will contact you shortly about the
              </p>
              <p className="text-white font-semibold text-sm">{vehicleLabel}</p>
              <Button variant="secondary" size="md" className="mt-6" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            /* Form */
            <>
              <h3 className="text-white font-bold text-lg mb-1">{TITLES[ctaType]}</h3>
              <p className="text-white/40 text-xs mb-5">{vehicleLabel}</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <Button variant="primary" size="lg" className="w-full mt-2">
                  {ctaType === "price" ? "Get My Price" : ctaType === "test_drive" ? "Request Test Drive" : "Start Application"}
                </Button>
                <p className="text-white/20 text-[10px] text-center">
                  By submitting, you agree to be contacted about this vehicle.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
