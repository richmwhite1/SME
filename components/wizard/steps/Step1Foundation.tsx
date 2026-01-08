"use client";

import { useProductWizardStore, Step1Schema } from "@/lib/stores/product-wizard-store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

export default function Step1Foundation() {
    const { data, updateData } = useProductWizardStore();
    const [charCount, setCharCount] = useState(0);

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        resolver: zodResolver(Step1Schema),
        defaultValues: {
            name: data.name || "",
            category: data.category || "",
            tagline: data.tagline || "",
            company_blurb: data.company_blurb || "",
        }
    });

    // Persist form data to store on change
    const formValues = watch();

    useEffect(() => {
        updateData(formValues);
    }, [JSON.stringify(formValues), updateData]);

    // Track tagline character count
    const taglineValue = watch("tagline");
    useEffect(() => {
        setCharCount(taglineValue?.length || 0);
    }, [taglineValue]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-6 border-l-2 border-emerald-500 pl-4">
                <h2 className="text-xl font-semibold text-white uppercase tracking-wider">I. The Foundation</h2>
                <p className="text-gray-500 text-sm mt-1">Marketing & Core — Establish product identity</p>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-500">
                    Product Name <span className="text-red-500">*</span>
                </label>
                <input
                    {...register("name")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                    placeholder="e.g. Neuro-Stack Alpha"
                />
                {errors.name && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.name.message as string}</p>}
            </div>

            {/* Primary Category */}
            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-500">
                    Primary Category <span className="text-red-500">*</span>
                </label>
                <select
                    {...register("category")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-base focus:border-emerald-500 focus:outline-none transition-colors text-white"
                >
                    <option value="">Select Primary Function...</option>
                    <option value="Survivalist">Survivalist</option>
                    <option value="Detox">Detox</option>
                    <option value="Brain Fog">Brain Fog</option>
                    <option value="Vitality">Vitality</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Gut Health">Gut Health</option>
                    <option value="Performance">Performance</option>
                    <option value="Hormones">Hormones</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Recovery">Recovery</option>
                </select>
                {errors.category && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.category.message as string}</p>}
            </div>

            {/* Tagline */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs uppercase tracking-wider text-gray-500">
                        Tagline <span className="text-gray-600">(Optional)</span>
                    </label>
                    <span className={`text-xs font-mono ${charCount > 100 ? 'text-red-500' : 'text-gray-600'}`}>
                        {charCount}/100
                    </span>
                </div>
                <input
                    {...register("tagline")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 text-white"
                    placeholder="A quick 'hook' for the product..."
                    maxLength={100}
                />
                <p className="text-xs text-gray-600">A concise, compelling statement that captures the product's essence.</p>
                {errors.tagline && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.tagline.message as string}</p>}
            </div>

            {/* Company Blurb */}
            <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-gray-500">
                    Company Blurb <span className="text-gray-600">(Optional)</span>
                </label>
                <textarea
                    {...register("company_blurb")}
                    className="w-full bg-[#0a0a0a] border border-[#333] p-3 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 min-h-[150px] text-white"
                    placeholder="Tell the brand story and product mission. This provides internal context for our SMEs..."
                />
                <p className="text-xs text-gray-600">
                    A descriptive space for the vendor to tell the brand story and product mission. This is the "internal context" for our SMEs.
                </p>
                {errors.company_blurb && <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.company_blurb.message as string}</p>}
            </div>
        </div>
    );
}
