"use client";

import { useState } from "react";
import { inspectExcel } from "@/app/actions/inspect-excel";
import { Button } from "@/components/ui/Button";

export function ImportDebugButton() {
    const [result, setResult] = useState<string>("");

    const handleInspect = async () => {
        const res = await inspectExcel();
        setResult(res.logs || "No logs");
    };

    return (
        <div>
            <Button onClick={handleInspect}>Run Excel Inspection</Button>
            {result && (
                <pre className="mt-4 p-4 bg-slate-100 rounded overflow-auto max-h-[500px] text-xs font-mono">
                    {result}
                </pre>
            )}
        </div>
    );
}
