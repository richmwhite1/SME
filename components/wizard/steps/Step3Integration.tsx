"use client";

import { useProductWizardStore, Step3Schema } from "@/lib/stores/product-wizard-store";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { AlertCircle, Plus, X, Users, Target, Wrench, MessageSquare } from "lucide-react";

export default function Step3Integration() {
    const { data, updateData } = useProductWizardStore();

    const { register, control, watch, formState: { errors } } = useForm({
        resolver: zodResolver(Step3Schema),
        defaultValues: {
            target_audience: data.target_audience || "",
            core_value_proposition: data.core_value_proposition || "",
            technical_specs: data.technical_specs || [],
            sme_access_note: data.sme_access_note || "",
            technical_docs_url: data.technical_docs_url || "",
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "technical_specs"
    });

    const formValues = watch();

    useEffect(() => {
        updateData(formValues);
    }, [JSON.stringify(formValues), updateData]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 border-l-2 border-emerald-500 pl-4">
                <h2 className="text-xl font-semibold text-white uppercase tracking-wider">III. SME Assessment Prep</h2>
                <p className="text-gray-500 text-sm mt-1">Technical — Prepare for expert evaluation</p>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">
                        Target Audience <span className="text-gray-600">(Optional)</span>
                    </label>
                </div>
                <input
                    {...register("target_audience")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                    placeholder="e.g. athletes, biohackers, seniors, busy professionals..."
                />
                <p className="text-xs text-gray-600">
                    Who is this product for? Describe the target user demographic or persona.
                </p>
                {errors.target_audience && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.target_audience.message as string}</p>}
            </div>

            {/* Core Value Proposition */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">
                        Core Value Proposition <span className="text-gray-600">(Optional)</span>
                    </label>
                </div>
                <textarea
                    {...register("core_value_proposition")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[100px] text-white"
                    placeholder="What specific problem does this product solve? What makes it unique?"
                />
                <p className="text-xs text-gray-600">
                    Clearly articulate the primary problem this product solves and its unique approach.
                </p>
                {errors.core_value_proposition && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.core_value_proposition.message as string}</p>}
            </div>

            {/* Technical Specs / Features */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">Technical Specs / Features</label>
                </div>
                <p className="text-xs text-gray-600">
                    Add key technical specifications or features as key-value pairs.
                </p>

                <div className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-2">
                            <input
                                {...register(`technical_specs.${index}.key` as const)}
                                className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                                placeholder="e.g. Battery Life"
                            />
                            <input
                                {...register(`technical_specs.${index}.value` as const)}
                                className="flex-1 bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                                placeholder="e.g. 20 hours"
                            />
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="px-3 py-2 bg-red-900/20 border border-red-500/30 text-red-500 hover:bg-red-900/40 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    {errors.technical_specs && (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {Array.isArray(errors.technical_specs)
                                ? "Please fill in all spec fields"
                                : "Invalid technical specs"}
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={() => append({ key: "", value: "" })}
                        className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors border border-[#333] hover:border-emerald-500/50 px-4 py-2 bg-[#0a0a0a]"
                    >
                        <Plus className="w-3 h-3" /> Add Specification
                    </button>
                </div>
            </div>

            {/* SME Access Note */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">SME Access Note</label>
                </div>
                <textarea
                    {...register("sme_access_note")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[100px] text-white"
                    placeholder="Optional: Instructions for expert reviewers (e.g., 'Reviewers should focus on the durability of the hinge')"
                />
                <p className="text-xs text-gray-600">
                    Optional: Provide specific guidance or focus areas for SME reviewers.
                </p>
                {errors.sme_access_note && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.sme_access_note.message as string}</p>}
            </div>

            {/* Technical Documentation Link */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-emerald-500" />
                    <label className="text-xs uppercase tracking-wider text-gray-500">Technical Documentation <span className="text-gray-600">(Optional)</span></label>
                </div>
                <input
                    {...register("technical_docs_url")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                    placeholder="https://example.com/specs.pdf"
                />
                <p className="text-xs text-gray-600">
                    Link to detailed specs, whitepapers, or lab methods.
                </p>
                {errors.technical_docs_url && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.technical_docs_url.message as string}</p>}
            </div>

        </div>
    );
}
