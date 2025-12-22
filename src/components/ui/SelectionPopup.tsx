"use client";

import { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Check, Search } from "lucide-react";
import clsx from "clsx";

interface Option {
    label: string;
    value: string;
    [key: string]: any; // Allow extra data
}

interface SelectionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    options: Option[];
    selectedValues?: string[]; // IDs/Values that are pre-selected
    onConfirm: (selected: string[]) => void;
    multiSelect?: boolean;
    maxSelections?: number;
}

export function SelectionPopup({
    isOpen,
    onClose,
    title,
    options,
    selectedValues = [],
    onConfirm,
    multiSelect = false,
    maxSelections
}: SelectionPopupProps) {
    const [search, setSearch] = useState("");
    const [currentSelection, setCurrentSelection] = useState<string[]>(selectedValues);

    const filteredOptions = useMemo(() => {
        return options.filter(opt => 
            opt.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    const handleToggle = (value: string) => {
        if (multiSelect) {
            setCurrentSelection(prev => {
                if (prev.includes(value)) {
                    return prev.filter(v => v !== value);
                } else {
                    if (maxSelections && prev.length >= maxSelections) return prev;
                    return [...prev, value];
                }
            });
        } else {
            setCurrentSelection([value]);
        }
    };

    const handleSave = () => {
        onConfirm(currentSelection);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-md focus:outline-indigo-500 border-slate-300"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                    {filteredOptions.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">No options found.</div>
                    ) : (
                        filteredOptions.map(opt => {
                            const isSelected = currentSelection.includes(opt.value);
                            return (
                                <div 
                                    key={opt.value} 
                                    onClick={() => handleToggle(opt.value)}
                                    className={clsx(
                                        "p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors text-sm",
                                        isSelected && "bg-indigo-50"
                                    )}
                                >
                                    <span className={clsx("font-medium", isSelected ? "text-indigo-700" : "text-slate-700")}>
                                        {opt.label}
                                    </span>
                                    {isSelected && <Check size={16} className="text-indigo-600" />}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>
                        Confirm {multiSelect && currentSelection.length > 0 && `(${currentSelection.length})`}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
