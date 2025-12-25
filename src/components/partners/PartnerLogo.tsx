"use client";

import { useState } from "react";

export function PartnerLogo({ logo, name, className = "" }: { logo?: string | null, name: string, className?: string }) {
    const [error, setError] = useState(false);

    const isValidImage = (url: string | null | undefined) => {
        if (!url) return false;
        if (!url.startsWith('http') && !url.startsWith('/')) return false;
        // Basic check for image extensions to avoid loading websites as images
        return /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(url);
    };

    if (isValidImage(logo) && !error) {
        return (
            <img 
                src={logo!} 
                alt={name} 
                className={className} 
                onError={() => setError(true)}
            />
        )
    }

    return (
        <div className={`flex items-center justify-center font-bold text-indigo-600 bg-indigo-50 ${className}`}>
            {name[0]}
        </div>
    )
}
