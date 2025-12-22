import { ImportDebugButton } from "@/components/debug/ImportDebugButton";
import { importProjectFromExcel } from "@/app/actions/import-project";

export default function ImportDebugPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Import Debug</h1>
            <ImportDebugButton />
            
            <div className="mt-8 border-t pt-8">
                <h2 className="text-xl font-bold mb-4">Run Full Import</h2>
                <form action={async () => {
                    "use server";
                    await importProjectFromExcel();
                }}>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        Import Project Now
                    </button>
                    <p className="text-sm text-slate-500 mt-2">Check the Project List after running this.</p>
                </form>
            </div>
        </div>
    );
}
