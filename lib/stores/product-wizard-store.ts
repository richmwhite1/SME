import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

// --- Zod Schemas ---

// Step 1: Marketing & Core (The Foundation)
// Only name and category are required
export const Step1Schema = z.object({
    name: z.string().min(2, "Product name is required"),
    category: z.string().min(1, "Category is required"),
    tagline: z.union([z.string().max(100, "Tagline must be 100 characters or less"), z.literal("")]).optional(),
    company_blurb: z.union([z.string(), z.literal("")]).optional(),
});

// Step 2: Visuals & Media (Show, Don't Tell)
export const Step2Schema = z.object({
    product_photos: z.array(z.string().url("Invalid photo URL")).default([]),
    video_url: z.union([z.string().url("Invalid video URL"), z.literal("")]).optional(),
});

// Step 3: SME Assessment Prep (Technical)
// All fields optional
export const Step3Schema = z.object({
    target_audience: z.union([z.string(), z.literal("")]).optional(),
    core_value_proposition: z.union([z.string(), z.literal("")]).optional(),
    technical_specs: z.array(z.object({
        key: z.string().min(1),
        value: z.string().min(1)
    })).default([]),
    sme_access_note: z.union([z.string(), z.literal("")]).optional(),
    technical_docs_url: z.union([z.string().url("Invalid documentation URL"), z.literal("")]).optional(),
});

// Step 4: Truth Signals (Evidence)
export const Step4Schema = z.object({
    sme_signals: z.record(z.string(), z.object({
        verified: z.boolean().optional(),
        evidence: z.string().min(1, "Evidence required"),
    })).optional(),
});

// Combined Schema for final submission
export const ProductWizardSchema = Step1Schema.merge(Step2Schema).merge(Step3Schema).merge(Step4Schema);

export type ProductWizardData = z.infer<typeof ProductWizardSchema>;

interface WizardState {
    currentStep: number;
    data: Partial<ProductWizardData>;
    isSubmitting: boolean;
    submissionError: string | null;
    _hasHydrated: boolean;

    // Actions
    setStep: (step: number) => void;
    updateData: (data: Partial<ProductWizardData>) => void;
    resetWizard: () => void;
    setSubmitting: (isSubmitting: boolean) => void;
    setError: (error: string | null) => void;
    setHasHydrated: (state: boolean) => void;
}

export const useProductWizardStore = create<WizardState>()(
    persist(
        (set) => ({
            currentStep: 1,
            data: {
                product_photos: [],
                technical_specs: [],
            },
            isSubmitting: false,
            submissionError: null,
            _hasHydrated: false,

            setStep: (step) => set({ currentStep: step }),
            updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
            resetWizard: () => set({
                currentStep: 1,
                data: {
                    product_photos: [],
                    technical_specs: [],
                },
                isSubmitting: false,
                submissionError: null
            }),
            setSubmitting: (isSubmitting) => set({ isSubmitting }),
            setError: (error) => set({ submissionError: error }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'product-wizard-storage',
            // Only persist data and step, not loading/error states
            partialize: (state) => ({ currentStep: state.currentStep, data: state.data }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
