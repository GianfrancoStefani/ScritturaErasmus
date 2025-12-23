import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { searchScopedOrganizations } from "@/app/actions/organizations";
import { CreateOrganizationDialog } from "./CreateOrganizationDialog";
import { Search, Plus } from "lucide-react";

// Fallback debounce since hook file is missing
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface OrganizationSelectorProps {
    type: string;
    projectId: string;
    onSelect: (org: any) => void;
    defaultValue?: string; // Name
}

export function OrganizationSelector({ type, projectId, onSelect, defaultValue }: OrganizationSelectorProps) {
    const [query, setQuery] = useState(defaultValue || "");
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounceValue(query, 300);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search effect
    useEffect(() => {
        if (!debouncedQuery) {
            setResults([]);
            return;
        }

        let active = true;
        setLoading(true);
        
        searchScopedOrganizations(debouncedQuery, type, projectId)
            .then(res => {
                if (active) {
                    setResults(res.data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (active) setLoading(false);
            });

        return () => { active = false; };
    }, [debouncedQuery, type, projectId]);

    const handleSelect = (org: any) => {
        setQuery(org.name);
        onSelect(org);
        setIsOpen(false);
    };

    const handleCreated = (org: any) => {
        setQuery(org.name);
        onSelect(org);
        setCreateOpen(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Input 
                    value={query} 
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={`Search ${type}...`}
                    className="pl-9"
                    aria-label="Organization Search"
                />
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {isOpen && query.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    {loading && <div className="p-2 text-xs text-slate-500 text-center">Searching...</div>}
                    
                    {!loading && results.length > 0 && (
                        <div className="py-1">
                            {results.map(org => (
                                <button
                                    key={org.id}
                                    type="button"
                                    onClick={() => handleSelect(org)}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                >
                                    <div className="font-medium text-slate-800">{org.name}</div>
                                    <div className="text-xs text-slate-500 flex gap-2">
                                        <span>{org.nation}</span>
                                        {org.type !== type && <span className="text-amber-600">({org.type})</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {!loading && (
                        <div className="p-2 border-t border-slate-100 bg-slate-50">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full justify-start text-xs h-8"
                                onClick={() => { setCreateOpen(true); setIsOpen(false); }}
                            >
                                <Plus size={14} className="mr-2" /> Create new "{type}"
                            </Button>
                        </div>
                    )}
                </div>
            )}
            
            <CreateOrganizationDialog 
                projectId={projectId}
                prefilledType={type}
                onCreated={handleCreated}
                isOpen={createOpen}
                onOpenChange={setCreateOpen}
            />
        </div>
    );
}
