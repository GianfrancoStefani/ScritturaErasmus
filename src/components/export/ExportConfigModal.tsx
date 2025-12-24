"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { 
    FileText, 
    Users, 
    Calendar, 
    Euro, 
    CheckSquare,
    Info,
    Layout
} from "lucide-react";
import { PDFConfig } from "@/lib/pdf-generator";

interface ExportConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: PDFConfig) => void;
    title: string;
}

export function ExportConfigModal({ isOpen, onClose, onConfirm, title }: ExportConfigModalProps) {
    const [config, setConfig] = useState<PDFConfig>({
        options: {
            includeCover: true,
            includePartnership: {
                coordinator: true,
                partners: true,
                others: true
            },
            includeContributions: true,
            includeMetadata: true,
            includeDates: true,
            includeBudget: true,
            includeContent: true
        },
        style: {
            theme: 'modern'
        }
    });

    const handleConfirm = () => {
        onConfirm(config);
        onClose();
    };

    const toggleOption = (key: keyof PDFConfig["options"]) => {
        if (typeof config.options[key] === 'boolean') {
            setConfig({
                ...config,
                options: {
                    ...config.options,
                    [key]: !config.options[key]
                }
            });
        }
    };

    const togglePartnerRole = (role: keyof PDFConfig["options"]["includePartnership"]) => {
        setConfig({
            ...config,
            options: {
                ...config.options,
                includePartnership: {
                    ...config.options.includePartnership,
                    [role]: !config.options.includePartnership[role]
                }
            }
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                {/* Structure & Content */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Layout size={14} /> Structure & Content
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={config.options.includeContent} 
                                onChange={() => toggleOption('includeContent')}
                                className="w-4 h-4 text-indigo-600 rounded" 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">Project Structure</span>
                                <span className="text-[10px] text-slate-500">Sections, WPs, Tasks</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={config.options.includeContributions} 
                                onChange={() => toggleOption('includeContributions')}
                                className="w-4 h-4 text-indigo-600 rounded" 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">Contributions</span>
                                <span className="text-[10px] text-slate-500">Official text from modules</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input 
                                type="checkbox" 
                                checked={config.options.includeMetadata} 
                                onChange={() => toggleOption('includeMetadata')}
                                className="w-4 h-4 text-indigo-600 rounded" 
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">Module Metadata</span>
                                <span className="text-[10px] text-slate-500">Status & Character counts</span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Partnership */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Users size={14} /> Partnership Roles
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={() => togglePartnerRole('coordinator')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                config.options.includePartnership.coordinator 
                                ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            Coordinator
                        </button>
                        <button 
                            onClick={() => togglePartnerRole('partners')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                config.options.includePartnership.partners 
                                ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            Partners
                        </button>
                        <button 
                            onClick={() => togglePartnerRole('others')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                                config.options.includePartnership.others 
                                ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            Other Roles
                        </button>
                    </div>
                </div>

                {/* Details */}
                <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Info size={14} /> Additional Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                                type="checkbox" 
                                checked={config.options.includeDates} 
                                onChange={() => toggleOption('includeDates')}
                                className="w-4 h-4 text-indigo-600 rounded" 
                            />
                             <span className="text-sm text-slate-700 group-hover:text-slate-900">Include Dates</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                                type="checkbox" 
                                checked={config.options.includeBudget} 
                                onChange={() => toggleOption('includeBudget')}
                                className="w-4 h-4 text-indigo-600 rounded" 
                            />
                             <span className="text-sm text-slate-700 group-hover:text-slate-900">Include Budget</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                             <input 
                                type="checkbox" 
                                checked={config.options.includeCover} 
                                onChange={() => toggleOption('includeCover')}
                                className="w-4 h-4 text-indigo-600 rounded" 
                            />
                             <span className="text-sm text-slate-700 group-hover:text-slate-900">Include Cover Page</span>
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirm} className="bg-indigo-600 text-white hover:bg-indigo-700">
                        Generate Report
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
