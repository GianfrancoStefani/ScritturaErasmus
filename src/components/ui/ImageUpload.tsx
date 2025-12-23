"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { uploadFile } from "@/app/actions/upload";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    value?: string | null;
    onChange: (url: string) => void;
    label?: string;
    className?: string;
}

export function ImageUpload({ value, onChange, label = "Upload Image", className }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        const res = await uploadFile(formData);
        
        if (res.error) {
            toast.error(res.error);
        } else if (res.url) {
            onChange(res.url);
            toast.success("Image uploaded");
        }
        setIsUploading(false);
        // Reset input
        if(inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={className}>
            {label && <label className="text-xs font-semibold text-slate-500 mb-1 block">{label}</label>}
            
            <div className="flex items-center gap-4">
                {value && (value.startsWith('http') || value.startsWith('/') || value.startsWith('data:')) ? (
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 group">
                        <img 
                            src={value} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('hidden'); // Hide container if image fails
                            }}
                        />
                            <button 
                                onClick={() => onChange("")}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                type="button"
                                aria-label="Remove image"
                            >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <div 
                        onClick={() => inputRef.current?.click()}
                        className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-colors"
                    >
                        {isUploading ? <Loader2 className="animate-spin text-indigo-500" size={24} /> : <Upload className="text-slate-400" size={24} />}
                        <span className="text-[10px] text-slate-400 mt-1">{isUploading ? "Uploading..." : "Click to upload"}</span>
                    </div>
                )}
                
                <input 
                    type="file" 
                    ref={inputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleUpload}
                    disabled={isUploading}
                    aria-label={label || "Upload file"}
                />
            </div>
        </div>
    );
}
