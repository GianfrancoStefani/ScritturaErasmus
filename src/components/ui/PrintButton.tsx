"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
    return (
        <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors ignore-on-print"
        >
            <Printer size={16} /> Print / Save as PDF
        </button>
    );
}
