"use client";

import { Plus, X } from "lucide-react";

interface TechnicalSpec {
    key: string;
    value: string;
}

interface TechnicalSpecsEditorProps {
    specs: TechnicalSpec[];
    onChange: (specs: TechnicalSpec[]) => void;
    editable?: boolean;
}

export default function TechnicalSpecsEditor({
    specs,
    onChange,
    editable = true,
}: TechnicalSpecsEditorProps) {
    const addSpec = () => {
        onChange([...specs, { key: "", value: "" }]);
    };

    const removeSpec = (index: number) => {
        onChange(specs.filter((_, i) => i !== index));
    };

    const updateSpec = (index: number, field: "key" | "value", value: string) => {
        const updated = [...specs];
        updated[index][field] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-gray-500">
                    Technical Specifications
                </label>
                {editable && (
                    <button
                        type="button"
                        onClick={addSpec}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add Spec
                    </button>
                )}
            </div>

            {specs.length === 0 ? (
                <div className="border border-dashed border-gray-700 p-6 text-center text-gray-600 text-sm">
                    No technical specifications added yet
                </div>
            ) : (
                <div className="space-y-3">
                    {specs.map((spec, index) => (
                        <div key={index} className="flex gap-2 items-start">
                            <input
                                type="text"
                                value={spec.key}
                                onChange={(e) => updateSpec(index, "key", e.target.value)}
                                placeholder="e.g., Weight"
                                disabled={!editable}
                                className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 disabled:opacity-50"
                            />
                            <input
                                type="text"
                                value={spec.value}
                                onChange={(e) => updateSpec(index, "value", e.target.value)}
                                placeholder="e.g., 2kg"
                                disabled={!editable}
                                className="flex-1 bg-[#0a0a0a] border border-[#333] p-2 text-sm focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-700 disabled:opacity-50"
                            />
                            {editable && (
                                <button
                                    type="button"
                                    onClick={() => removeSpec(index)}
                                    className="bg-red-900/20 border border-red-500/50 p-2 text-red-400 hover:bg-red-900/40 transition-colors"
                                    aria-label="Remove specification"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
