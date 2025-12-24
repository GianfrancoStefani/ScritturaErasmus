"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

interface Option {
    value: string;
    label: string;
    subLabel?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSearch?: (query: string) => void; // Optional for async search
    disabled?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Select...", onSearch, disabled = false }: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get selected label
    const selectedOption = options.find(o => o.value === value);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle search changes
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (onSearch) {
             onSearch(val);
        }
    };
    
    // Reset search when opening if needed, or keep it? 
    // Usually better to keep empty or sync with selected label but that's complex for async.
    // For now, simple text filter.

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setOpen(false);
        setSearchTerm(""); // Reset search
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                className={`flex items-center justify-between w-full border rounded-md px-3 py-2 text-sm bg-white cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400'}`}
                onClick={() => !disabled && setOpen(!open)}
            >
                <span className={`block truncate ${!selectedOption ? "text-slate-400" : "text-slate-900"}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <div className="flex items-center gap-1">
                    {selectedOption && !disabled && (
                        <div role="button" aria-label="Clear selection" onClick={clearSelection} className="p-1 hover:bg-slate-100 rounded-full">
                            <X className="w-3 h-3 text-slate-400" />
                        </div>
                    )}
                    <ChevronsUpDown className="w-4 h-4 text-slate-400 opacity-50" />
                </div>
            </div>

            {open && !disabled && (
                <div className="absolute z-[9999] w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto animate-in fade-in zoom-in-95 duration-100">
                    <div className="sticky top-0 p-2 bg-white border-b">
                         <input 
                            ref={inputRef}
                            autoFocus
                            type="text"
                            placeholder="Search..."
                            className="w-full text-sm p-1.5 border rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={handleSearch}
                         />
                    </div>
                    <div className="py-1">
                        {filteredOptions.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-slate-500 text-center">No results found.</div>
                        ) : (
                            filteredOptions.map((opt) => (
                                <div 
                                    key={opt.value}
                                    className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between hover:bg-slate-50 ${opt.value === value ? "bg-blue-50 text-blue-700" : "text-slate-700"}`}
                                    onClick={() => handleSelect(opt.value)}
                                >
                                    <div>
                                        <div className="font-medium">{opt.label}</div>
                                        {opt.subLabel && <div className="text-xs text-slate-400">{opt.subLabel}</div>}
                                    </div>
                                    {opt.value === value && <Check className="w-4 h-4" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
