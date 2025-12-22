"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton() {
    return (
        <div className="fixed bottom-8 right-8 print:hidden">
            <Button 
                onClick={() => window.print()} 
                className="shadow-xl rounded-full px-6 py-4 h-auto flex items-center gap-2"
                variant="primary"
            >
                <Printer size={20} /> Print / Save PDF
            </Button>
        </div>
    );
}
