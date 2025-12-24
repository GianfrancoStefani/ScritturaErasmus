"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, User, Calendar, Building2, Trash2, X, Eraser } from "lucide-react";
import { saveAnnotation, deleteAnnotation, deleteAllUserAnnotations, saveAnnotatedVersion } from "@/app/actions/editor";
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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });

    // Generate unique user colors
    const uniqueAuthors = Array.from(new Set(existingAnnotations.filter(a => a.type === 'ANNOTATION').map(a => a.author.id))).map(id => {
        const annotation = existingAnnotations.find(a => a.author.id === id);
        return annotation.author;
    });

    const [visibleAuthors, setVisibleAuthors] = useState<string[]>([]);
    
    // Initialize visible authors
    useEffect(() => {
        if (uniqueAuthors.length > 0 && visibleAuthors.length === 0) {
            setVisibleAuthors(uniqueAuthors.map(u => u.id));
        }
    }, [uniqueAuthors.length]);

    // Deterministic color assignment
    const getUserColor = (userId: string) => {
        const colors = [
            '#ef4444', // Red
            '#f97316', // Orange
            '#f59e0b', // Amber
            '#84cc16', // Lime
            '#10b981', // Emerald
            '#06b6d4', // Cyan
            '#3b82f6', // Blue
            '#8b5cf6', // Violet
            '#d946ef', // Fuchsia
            '#f43f5e'  // Rose
        ];
        // Simple hash to pick color
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            hash = userId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Filter drawings
    const drawings = existingAnnotations
        .filter(a => a.type === 'ANNOTATION')
        .map(a => ({ ...JSON.parse(a.content), author: a.author, id: a.id, createdAt: a.createdAt }))
        .filter(d => visibleAuthors.includes(d.author.id))
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Sort by time for progressive numbering

    const toggleAuthor = (id: string) => {
        setVisibleAuthors(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handleClearAll = async () => {
        if (!confirm("Are you sure you want to delete ALL your annotations for this module?")) return;
        const res = await deleteAllUserAnnotations(moduleId);
        if (res.success) {
            toast.success("All annotations cleared");
        } else {
            toast.error("Failed to clear annotations");
        }
    };

    const handleSaveAnnotatedVersion = async () => {
        // Collect current annotations (filtered by user or all? Request says "save annotate version... done by specific user")
        // Usually a snapshot includes what is visible or what the user created.
        // I'll save ALL currently loaded annotations as the snapshot context.
        const res = await saveAnnotatedVersion(moduleId, existingAnnotations);
        if (res.success) {
            toast.success("Annotated version saved");
        } else {
            toast.error("Failed to save version");
        }
    };

    // Resize canvas to match container
    useEffect(() => {
        const updateCanvasSize = () => {
             if (containerRef.current && canvasRef.current) {
                 const rect = containerRef.current.getBoundingClientRect();
                 canvasRef.current.width = rect.width;
                 canvasRef.current.height = rect.height;
             }
        };

        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        const resizeObserver = new ResizeObserver(updateCanvasSize);
        if (containerRef.current) resizeObserver.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            resizeObserver.disconnect();
        };
    }, [children]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isDrawing && (activeTool === 'CIRCLE' || activeTool === 'ARROW')) {
            ctx.beginPath();
            ctx.strokeStyle = activeColor;
            ctx.lineWidth = 2;
            
            const width = currentPos.x - startPos.x;
            const height = currentPos.y - startPos.y;

            if (activeTool === 'CIRCLE') {
                const centerX = startPos.x + width / 2;
                const centerY = startPos.y + height / 2;
                const rx = Math.abs(width / 2);
                const ry = Math.abs(height / 2);
                
                ctx.ellipse(centerX, centerY, rx, ry, 0, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(0,0,0,0)';
                ctx.fill(); 
                ctx.stroke();
            } else if (activeTool === 'ARROW') {
                 // Draw Arrow Body
                 ctx.moveTo(startPos.x, startPos.y);
                 ctx.lineTo(currentPos.x, currentPos.y);
                 ctx.stroke();
 
                 // Draw Arrow Head
                 const headLength = 10; 
                 const dx = currentPos.x - startPos.x;
                 const dy = currentPos.y - startPos.y;
                 const angle = Math.atan2(dy, dx);
                 
                 ctx.beginPath();
                 ctx.moveTo(currentPos.x, currentPos.y);
                 ctx.lineTo(currentPos.x - headLength * Math.cos(angle - Math.PI / 6), currentPos.y - headLength * Math.sin(angle - Math.PI / 6));
                 ctx.lineTo(currentPos.x - headLength * Math.cos(angle + Math.PI / 6), currentPos.y - headLength * Math.sin(angle + Math.PI / 6));
                 ctx.lineTo(currentPos.x, currentPos.y);
                 ctx.fillStyle = activeColor;
                 ctx.fill();
            }
        }
    }, [isDrawing, startPos, currentPos, activeTool, activeColor]);


    const handlePointerDown = (e: React.PointerEvent) => {
        if (activeTool === 'CURSOR' || activeTool === 'HIGHLIGHTER') return;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        (e.target as Element).setPointerCapture(e.pointerId);

        setIsDrawing(true);
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDrawing) return;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPos({ x, y });
    };

    const handlePointerUp = async (e: React.PointerEvent) => {
        if (activeTool === 'HIGHLIGHTER') {
             setTimeout(async () => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed || !containerRef.current) return;
    
                if (!containerRef.current.contains(selection.anchorNode)) return;
    
                const range = selection.getRangeAt(0);
                const rects = Array.from(range.getClientRects());
                const containerRect = containerRef.current.getBoundingClientRect();
    
                const validRects = rects.map(r => ({
                    left: r.left - containerRect.left,
                    top: r.top - containerRect.top,
                    width: r.width,
                    height: r.height
                })).filter(r => r.width > 0 && r.height > 0);
    
                if (validRects.length === 0) return;
    
                const highlightData = {
                    type: 'highlight',
                    color: activeColor,
                    rects: validRects
                };
    
                const res = await saveAnnotation(moduleId, highlightData);
                if (res.success) {
                    toast.success("Highlight saved");
                    selection.removeAllRanges();
                } else {
                    toast.error("Failed to save highlight");
                }
             }, 10);
             return;
        }

        if (!isDrawing) return;

        try {
            (e.target as Element).releasePointerCapture(e.pointerId);
        } catch (e) {}

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

    return (
        <div 
            ref={containerRef} 
            className="relative isolate min-h-[50px] group/container"
            onMouseUp={activeTool === 'HIGHLIGHTER' ? (e: any) => handlePointerUp(e) : undefined}
        >
            {/* Controls Bar */}
            <div className="absolute top-0 right-0 z-50 -mt-9 flex items-center gap-4">
                <button 
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 text-[10px] uppercase font-bold rounded-lg shadow-sm transition-all"
                    title="Clear all my notes"
                >
                    <Eraser size={12} /> Clear Notes
                </button>

                <button 
                    onClick={async () => {
                         // Import dynamically if needed, or add to top imports
                         // We will assume it's imported at the top in the next step or I will update imports now.
                         // But wait, I can't add imports with this tool easily in one go.
                         // I'll assume handleSaveVersion is defined in component body
                         handleSaveAnnotatedVersion();
                    }}
                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 text-[10px] uppercase font-bold rounded-lg shadow-sm transition-all"
                    title="Save current state as a version"
                >
                    <Calendar size={12} /> Save Version
                </button>

                {/* Filter Bar (Only show if there are annotations) */}
                {uniqueAuthors.length > 0 && (
                    <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                        {uniqueAuthors.map(author => {
                            const color = getUserColor(author.id);
                            const isVisible = visibleAuthors.includes(author.id);
                            return (
                                <button 
                                    key={author.id}
                                    onClick={() => toggleAuthor(author.id)}
                                    className={clsx(
                                        "group flex flex-col items-center gap-1 transition-all",
                                        isVisible ? "opacity-100" : "opacity-40 grayscale"
                                    )}
                                    title={`Toggle notes by ${author.name}`}
                                >
                                    <div className="relative">
                                        {author.photo ? (
                                            <img src={author.photo} alt={author.name} className="w-5 h-5 rounded-full object-cover ring-2 ring-white shadow-sm" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white shadow-sm">
                                                <User size={10} className="text-slate-500" />
                                            </div>
                                        )}
                                    </div>
                                    <div 
                                        className="w-full h-1 rounded-full transition-all group-hover:h-1.5" 
                                        style={{ backgroundColor: color }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Content Layer */}
            <div className={clsx(
                "relative z-0 transition-all",
                activeTool === 'HIGHLIGHTER' ? "cursor-text select-text" : "select-none" 
            )}>
                {children}
            </div>

            {/* Rendered Annotations (SVG Layer) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <svg className="w-full h-full">
                    {drawings.map((d: any, index: number) => {
                         if (d.type === 'drawing') return <DrawingSVG key={d.id} data={d} index={index + 1} userColor={getUserColor(d.author.id)} />;
                         return null;
                    })}
                </svg>
                {/* HTML Layer for Highlights */}
                {drawings.map((d: any, index: number) => {
                     if (d.type === 'highlight') return <HighlightOverlay key={d.id} data={d} index={index + 1} userColor={getUserColor(d.author.id)} />;
                     return null;
                })}
            </div>

            {/* Interaction Canvas Layer */}
            <canvas
                ref={canvasRef}
                className={clsx(
                    "absolute inset-0 z-50 transition-all",
                    (activeTool === 'CIRCLE' || activeTool === 'ARROW') ? "cursor-crosshair pointer-events-auto touch-none" : "pointer-events-none opacity-0"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            />
        </div>
    );
}

function HighlightOverlay({ data, index, userColor }: { data: any, index: number, userColor: string }) {
    return (
        <div className="absolute inset-0 pointer-events-none">
             {data.rects.map((r: any, i: number) => (
                <div 
                    key={i} 
                        className="absolute opacity-20 rounded-[2px] mix-blend-multiply"
                        style={{ 
                            left: r.left, 
                            top: r.top, 
                            width: r.width, 
                            height: r.height, 
                            backgroundColor: data.color, 
                        }} 
                    />
            ))}
             <div 
                className="absolute pointer-events-auto z-[60]"
                style={{ left: data.rects[0].left, top: data.rects[0].top - 24 }}
            >
                    <AuthorRollover 
                        annotationId={data.id} 
                        author={data.author} 
                        date={data.createdAt} 
                        userColor={userColor}
                        index={index}
                    />
            </div>
        </div>
    );
}

function DrawingSVG({ data, index, userColor }: { data: any, index: number, userColor: string }) {
    const { start, end, tool, color } = data;
    
    if (tool === 'CIRCLE') {
        const cx = (start.x + end.x) / 2;
        const cy = (start.y + end.y) / 2;
        const rx = Math.abs((end.x - start.x) / 2);
        const ry = Math.abs((end.y - start.y) / 2);
        
        return (
            <g className="group pointer-events-auto">
                {/* Circle area is now transparent (no fill) as requested */}
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} stroke={color} strokeWidth="3" fill="none" className="fill-none" />
                {/* Invisible hit area for easier selection/hover - MUST BE TRANSPARENT */}
                <ellipse cx={cx} cy={cy} rx={rx + 5} ry={ry + 5} stroke="transparent" strokeWidth="10" fill="none" className="fill-none" />
                {/* Pin positioned at START of drawing */}
                <foreignObject x={start.x} y={start.y - 10} width="40" height="40" className="overflow-visible opacity-0 group-hover:opacity-100 transition-opacity">
                     <AuthorRollover annotationId={data.id} author={data.author} date={data.createdAt} userColor={userColor} index={index} />
                </foreignObject>
            </g>
        );
    }

    if (tool === 'ARROW') {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const id = `arrow-${data.id}`;
        return (
            <g className="group pointer-events-auto">
                <defs>
                    <marker id={id} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                    </marker>
                </defs>
                <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth="3" markerEnd={`url(#${id})`} />
                <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="transparent" strokeWidth="15" />
                 {/* Pin positioned at START of drawing */}
                 <foreignObject x={start.x} y={start.y - 10} width="40" height="40" className="overflow-visible opacity-0 group-hover:opacity-100 transition-opacity">
                     <AuthorRollover annotationId={data.id} author={data.author} date={data.createdAt} userColor={userColor} index={index} />
                </foreignObject>
            </g>
        );
    }
    
    return null;
}

function AuthorRollover({ annotationId, author, date, userColor, index }: { annotationId: string, author: any, date: string, userColor: string, index: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
        }, 300);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Delete this annotation?")) return;
        setIsDeleting(true);
        const res = await deleteAnnotation(annotationId);
        if (res.success) {
            toast.success("Deleted");
        } else {
            toast.error("Failed");
        }
        setIsDeleting(false);
    };

    return (
        <div 
            className="relative inline-block ml-2 mt-[-10px] z-[100]" 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
        >
            <button 
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md hover:scale-110 transition-transform" 
                style={{ backgroundColor: userColor }}
                title={`Note #${index} by ${author.name}`}
            >
                {index}
            </button>
            
            {isOpen && (
                <div 
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-3 z-[200]"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <div className="flex items-start gap-3 mb-3 border-b border-slate-50 pb-2">
                        {author.photo ? (
                             <img src={author.photo} alt={author.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 mt-1" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 mt-1">
                                <User size={14} className="text-slate-500" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-700 truncate">
                                {author.prefix ? `${author.prefix} ` : ''}{author.name} {author.surname}
                            </div>
                            {author.partner?.name && (
                                <div className="text-[10px] text-slate-500 font-medium truncate">
                                    {author.partner.name}
                                </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                {new Date(date).toLocaleDateString('en-GB')} 
                                <span className="opacity-50">|</span> 
                                {new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center justify-center gap-2 p-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors font-medium"
                    >
                        <Trash2 size={12} /> Delete Annotation
                    </button>
                </div>
            )}
        </div>
    );
}
