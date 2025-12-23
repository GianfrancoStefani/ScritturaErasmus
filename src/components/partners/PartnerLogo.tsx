"use client";

import { useState } from "react";

export function PartnerLogo({ logo, name, className = "" }: { logo?: string | null, name: string, className?: string }) {
    const [error, setError] = useState(false);

    if (logo && (logo.startsWith('http') || logo.startsWith('/')) && !error) {
        return (
            <img 
                src={logo} 
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
