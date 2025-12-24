"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, User, Calendar, Building2, Trash2 } from "lucide-react";
import { saveAnnotation, deleteAnnotation } from "@/app/actions/editor";
import { toast } from "sonner";
import clsx from "clsx";

interface AnnotationLayerProps {
    moduleId: string;
    children: React.ReactNode;
    activeTool: 'CURSOR' | 'HIGHLIGHTER' | 'CIRCLE' | 'ARROW';
    activeColor: string;
    existingAnnotations: any[];
}

export function AnnotationLayer({ 
    moduleId, 
    children, 
    activeTool, 
    activeColor,
    existingAnnotations 
}: AnnotationLayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [tempDrawing, setTempDrawing] = useState<any>(null);

    // Filter drawings from existing annotations
    const drawings = existingAnnotations
        .filter(a => a.type === 'ANNOTATION')
        .map(a => ({ ...JSON.parse(a.content), author: a.author, id: a.id, createdAt: a.createdAt }));

    const handleMouseDown = (e: React.MouseEvent) => {
        if (activeTool === 'CURSOR' || activeTool === 'HIGHLIGHTER') return;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        setIsDrawing(true);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPos({ x, y });
    };

    const handleMouseUp = async () => {
        if (!isDrawing && activeTool !== 'HIGHLIGHTER') return;

        if (activeTool === 'HIGHLIGHTER') {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || !containerRef.current) return;

            const range = selection.getRangeAt(0);
            const rects = Array.from(range.getClientRects());
            const containerRect = containerRef.current.getBoundingClientRect();

            const highlightData = {
                type: 'highlight',
                color: activeColor,
                rects: rects.map(r => ({
                    left: r.left - containerRect.left,
                    top: r.top - containerRect.top,
                    width: r.width,
                    height: r.height
                }))
            };

            const res = await saveAnnotation(moduleId, highlightData);
            if (res.success) {
                toast.success("Highlight saved");
                selection.removeAllRanges();
            } else {
                toast.error("Failed to save highlight");
            }
            return;
        }

        setIsDrawing(false);
        const annotationData = {
            type: 'drawing',
            tool: activeTool,
            color: activeColor,
            start: startPos,
            end: currentPos
        };

        const res = await saveAnnotation(moduleId, annotationData);
        if (res.success) {
            toast.success("Annotation saved");
        } else {
            toast.error("Failed to save annotation");
        }
    };

    const renderAnnotation = (d: any, isTemp = false) => {
        if (d.type === 'highlight') {
            return (
                <div key={isTemp ? 'temp-h' : d.id} className="absolute inset-0 pointer-events-none group">
                    {d.rects.map((r: any, i: number) => (
                        <div 
                            key={i} 
                            style={{ 
                                position: 'absolute', 
                                left: r.left, 
                                top: r.top, 
                                width: r.width, 
                                height: r.height, 
                                backgroundColor: d.color, 
                                opacity: 0.3, 
                                borderRadius: '2px' 
                            }} 
                        />
                    ))}
                    {!isTemp && (
                        <div 
                            className="absolute pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: d.rects[0].left, top: d.rects[0].top - 20 }}
                        >
                             <AuthorRollover annotationId={d.id} author={d.author} date={d.createdAt} />
                        </div>
                    )}
                </div>
            );
        }

        if (d.type !== 'drawing') return null;

        const { start, end, tool, color } = d;
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        const left = Math.min(start.x, end.x);
        const top = Math.min(start.y, end.y);

        return (
            <div 
                key={isTemp ? 'temp' : d.id} 
                className="absolute pointer-events-none group"
                style={{ left, top, width, height }}
            >
                <svg className="w-full h-full overflow-visible">
                    {tool === 'CIRCLE' && (
                        <ellipse 
                            cx={width / 2} 
                            cy={height / 2} 
                            rx={width / 2} 
                            ry={height / 2} 
                            stroke={color} 
                            strokeWidth="2" 
                            fill="none" 
                        />
                    )}
                    {tool === 'ARROW' && (
                        <g>
                            <defs>
                                <marker 
                                    id={`arrowhead-${d.id || 'temp'}`} 
                                    markerWidth="10" 
                                    markerHeight="7" 
                                    refX="0" 
                                    refY="3.5" 
                                    orient="auto"
                                >
                                    <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                                </marker>
                            </defs>
                            <line 
                                x1={start.x < end.x ? 0 : width} 
                                y1={start.y < end.y ? 0 : height} 
                                x2={start.x < end.x ? width : 0} 
                                y2={start.y < end.y ? height : 0} 
                                stroke={color} 
                                strokeWidth="2" 
                                markerEnd={`url(#arrowhead-${d.id || 'temp'})`} 
                            />
                        </g>
                    )}
                </svg>
                
                {!isTemp && (
                    <div className="absolute -top-3 -right-3 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
                         <AuthorRollover annotationId={d.id} author={d.author} date={d.createdAt} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div 
            ref={containerRef}
            className={clsx(
                "relative transition-all",
                activeTool !== 'CURSOR' ? "cursor-crosshair" : ""
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >
            {/* Base Content */}
            <div className="relative z-0">
                {children}
            </div>

            {/* Drawing Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                {drawings.map(d => renderAnnotation(d))}
                {isDrawing && renderAnnotation({ type: 'drawing', start: startPos, end: currentPos, tool: activeTool, color: activeColor }, true)}
            </div>
        </div>
    );
}


function AuthorRollover({ annotationId, author, date }: { annotationId: string, author: any, date: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Delete this annotation?")) return;
        setIsDeleting(true);
        const res = await deleteAnnotation(annotationId);
        if (res.success) {
            toast.success("Annotation deleted");
        } else {
            toast.error("Failed to delete");
        }
        setIsDeleting(false);
    };

    return (
        <div className="relative inline-block">
            <button 
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-indigo-600 shadow-sm hover:scale-110 transition-all"
                title="Annotation Info"
            >
                <Info size={14} />
            </button>

            {isOpen && (
                <div 
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-[200] animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-50">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            {author.image ? <img src={author.image} className="w-full h-full rounded-full object-cover" alt={author.name} /> : <User size={20} />}
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-slate-800 text-sm leading-tight">{author.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">Project Collaborator</div>
                        </div>
                        <button 
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Annotation"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Building2 size={12} className="text-slate-400" />
                            <span>Partner ID: {author.partnerId || 'Lead Partner'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar size={12} className="text-slate-400" />
                            <span>{new Date(date).toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white" />
                </div>
            )}
        </div>
    );
}
