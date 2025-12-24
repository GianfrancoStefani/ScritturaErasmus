"use client";

import * as React from "react"
import { ChevronDown } from "lucide-react"
import clsx from "clsx"

// Simple Accordion Implementation using Context
// To allow "multiple" or "single" mode. For now, matching the Radix API used in the page (Accordion, Item, Trigger, Content)

interface AccordionProps {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
  children: React.ReactNode
  className?: string
}

const AccordionContext = React.createContext<{
  expandedValues: string[]
  toggle: (value: string) => void
} | null>(null)

export function Accordion({ type = "single", defaultValue, className, children }: AccordionProps) {
    // Simplified: local state, supports multiple open if type="multiple"
    const [expandedValues, setExpandedValues] = React.useState<string[]>(
        Array.isArray(defaultValue) ? defaultValue : (defaultValue ? [defaultValue] : [])
    );

    const toggle = (value: string) => {
        setExpandedValues(prev => {
            if (type === "multiple") {
                return prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value];
            } else {
                return prev.includes(value) ? [] : [value];
            }
        });
    };

    return (
        <AccordionContext.Provider value={{ expandedValues, toggle }}>
            <div className={className}>{children}</div>
        </AccordionContext.Provider>
    )
}

export function AccordionItem({ value, children, className }: { value: string, children: React.ReactNode, className?: string }) {
    // We pass value down implicitly via context check
    return (
        <div data-value={value} className={clsx("border-b", className)}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { itemValue: value } as any);
                }
                return child;
            })}
        </div>
    )
}

export function AccordionTrigger({ children, className, itemValue }: any) {
    const ctx = React.useContext(AccordionContext);
    const isOpen = ctx?.expandedValues.includes(itemValue);

    return (
        <button
            onClick={() => ctx?.toggle(itemValue)}
            className={clsx(
                "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
                className
            )}
            data-state={isOpen ? "open" : "closed"}
        >
            {children}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
    )
}

export function AccordionContent({ children, className, itemValue }: any) {
    const ctx = React.useContext(AccordionContext);
    const isOpen = ctx?.expandedValues.includes(itemValue);

    if (!isOpen) return null;

    return (
        <div className={clsx("overflow-hidden text-sm transition-all animate-in slide-in-from-top-1", className)}>
            <div className="pb-4 pt-0">{children}</div>
        </div>
    )
}
