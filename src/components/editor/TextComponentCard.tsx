import { TextComponent, User, Comment, Rating } from "@prisma/client";
import { format } from "date-fns";
import { User as UserIcon, MessageSquare, Star, CheckCircle, Trash2, ArrowUpRight, Send, GripVertical, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { deleteContribution, mergeContribution, addComment, rateComponent } from "@/app/actions/module-editor";
import { useState } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ExtendedTextComponent = TextComponent & {
    author: User;
    comments: (Comment & { user: User })[];
    ratings: Rating[];
};

export function TextComponentCard({ component, currentUserId, isManager }: { 
    component: ExtendedTextComponent, 
    currentUserId: string,
    isManager: boolean
}) {
    const router = useRouter();
    const isAuthor = component.authorId === currentUserId;
    const [isMerging, setIsMerging] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: component.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : undefined, // Cast to const to satisfy type check
    };

    // Calculate rating
    const userRating = component.ratings.find(r => r.userId === currentUserId)?.value || 0;
    const avgRating = component.ratings.length > 0 
        ? (component.ratings.reduce((a, b) => a + b.value, 0) / component.ratings.length).toFixed(1) 
        : null;

    const handleMerge = async () => {
        if (confirm("Merge this contribution into the official text?")) {
            setIsMerging(true);
            await mergeContribution(component.id);
            setIsMerging(false);
            router.refresh();
        }
    };

    const handleDelete = async () => {
        if (confirm("Delete this contribution?")) {
            await deleteContribution(component.id);
            router.refresh();
        }
    };

    const handleComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setIsSubmittingComment(true);
        await addComment(component.id, currentUserId, commentText);
        setCommentText("");
        setIsSubmittingComment(false);
        router.refresh();
    };

    const handleRate = async (value: number) => {
        await rateComponent(component.id, currentUserId, value);
        router.refresh();
    };

    // Extract a "Title" from content (strip HTML and take first 50 chars)
    const previewText = component.content.replace(/<[^>]+>/g, '').substring(0, 60) + "...";

    return (
        <div 
            ref={setNodeRef} 
            style={style}
            className={`bg-white rounded-lg border shadow-sm transition-all ${component.status === 'ACCEPTED' ? 'border-green-200 bg-green-50/30' : 'border-slate-200'}`}
        >
            <div className="flex items-center p-2 border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                 {/* Drag Handle */}
                 <button className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing mr-1" {...attributes} {...listeners}>
                    <GripVertical size={16} />
                </button>

                {/* Collapser */}
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1 text-slate-400 hover:text-slate-600 mr-2"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>

                {/* Header Info */}
                <div className="flex-1 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                            {component.author.name?.[0]}{component.author.surname?.[0]}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                            <span className="text-sm font-semibold text-slate-800">
                                {component.author.name} {component.author.surname}
                            </span>
                            {isCollapsed && (
                                <span className="text-xs text-slate-500 line-clamp-1 italic max-w-[200px]">
                                    {previewText}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 mr-2 hidden sm:inline">
                             {format(new Date(component.createdAt), "MMM d, HH:mm")}
                        </span>
                        {component.status === 'ACCEPTED' && (
                            <span className="text-green-600 bg-green-100 p-1 rounded-full" title="Merged">
                                <CheckCircle size={14} />
                            </span>
                        )}
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            component.type === 'USER_TEXT' ? 'bg-blue-100 text-blue-700' :
                            component.type === 'COORD_NOTE' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                            {component.type.replace('_', ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {!isCollapsed && (
                <div className="p-4 pt-2">
                     <div className="prose prose-sm max-w-none text-slate-700 mb-3" dangerouslySetInnerHTML={{ __html: component.content }} />

                    <div className="flex items-center justify-between main-actions pt-2 border-t border-slate-100">
                        <div className="flex gap-4 items-center">
                            <button 
                                onClick={() => setShowComments(!showComments)}
                                className={clsx(
                                    "flex items-center gap-1 text-xs hover:text-slate-900 transition-colors",
                                    (showComments || component.comments.length > 0) ? "text-indigo-600 font-medium" : "text-slate-400"
                                )}
                            >
                                <MessageSquare size={14} /> 
                                {component.comments.length > 0 ? `${component.comments.length} Comments` : "Comment"}
                            </button>
                            
                            <div className="flex items-center gap-1 group relative">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star}
                                        onClick={() => handleRate(star)}
                                        className="focus:outline-none"
                                    >
                                        <Star 
                                            size={14} 
                                            className={clsx(
                                                star <= (userRating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-300"
                                            )} 
                                        />
                                    </button>
                                ))}
                                {avgRating && <span className="text-xs text-slate-500 ml-1">({avgRating})</span>}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            {(isAuthor || isManager) && (
                                <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded transition-colors" title="Delete">
                                    <Trash2 size={14} />
                                </button>
                            )}
                            
                            {isManager && component.status !== 'ACCEPTED' && component.type === 'USER_TEXT' && (
                                <Button size="sm" variant="ghost" onClick={handleMerge} disabled={isMerging} className="h-7 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100">
                                    <ArrowUpRight size={14} /> Merge
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Comments Section */}
                    {showComments && (
                        <div className="mt-3 pt-3 border-t border-slate-100 bg-slate-50/50 -mx-4 px-4 pb-2">
                            <div className="space-y-3 mb-3">
                                {component.comments.map(comment => (
                                    <div key={comment.id} className="flex gap-2 text-sm">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                            {comment.user.name?.[0]}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2">
                                                <span className="font-semibold text-slate-700 text-xs">{comment.user.name}</span>
                                                <span className="text-[10px] text-slate-400">{format(new Date(comment.createdAt), "MMM d, HH:mm")}</span>
                                            </div>
                                            <p className="text-slate-600">{comment.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <form onSubmit={handleComment} className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 text-sm border rounded px-2 py-1 focus:outline-indigo-500"
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <Button size="sm" disabled={!commentText.trim() || isSubmittingComment} className="h-8 w-8 p-0">
                                    <Send size={14} />
                                </Button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
