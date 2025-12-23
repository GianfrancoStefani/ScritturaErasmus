"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { proposeName, voteName, getProposals } from "@/app/actions/naming";
import { Star, Trophy, Award, Medal, User } from "lucide-react";
import { toast } from "sonner";

export function NamingChallenge({ projectId, userId }: { projectId: string; userId: string }) {
    const [proposals, setProposals] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"VOTE" | "PROPOSE">("VOTE");
    
    // Propose Form
    const [title, setTitle] = useState("");
    const [acronym, setAcronym] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadProposals();
    }, [projectId]);

    const loadProposals = async () => {
        const res = await getProposals(projectId);
        if (Array.isArray(res)) {
            setProposals(res);
        }
    };

    const handlePropose = async () => {
        if (!title || !acronym) return;
        setIsSubmitting(true);
        const res = await proposeName(projectId, title, acronym);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Proposal submitted!");
            setTitle("");
            setAcronym("");
            setActiveTab("VOTE");
            loadProposals();
        }
        setIsSubmitting(false);
    };

    const handleVote = async (proposalId: string, stars: number) => {
        const res = await voteName(proposalId, stars);
        if (res.error) {
            toast.error(res.error);
        } else {
            toast.success("Vote recorded");
            loadProposals();
        }
    };

    // Calculate ranking visual
    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="text-yellow-500" size={24} />;
        if (index === 1) return <Medal className="text-slate-400" size={24} />; 
        if (index === 2) return <Medal className="text-amber-700" size={24} />; 
        return <span className="font-mono text-slate-400 font-bold ml-2 text-lg">#{index + 1}</span>;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <Award className="text-indigo-600" /> Naming Challenge
                    </h3>
                    <p className="text-sm text-slate-500">Collaborate to choose the best Title and Acronym for this project.</p>
                </div>
                <div className="bg-slate-200/50 p-1 rounded-lg flex">
                    <button 
                        onClick={() => setActiveTab("VOTE")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'VOTE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Leaderboard
                    </button>
                    <button 
                        onClick={() => setActiveTab("PROPOSE")}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'PROPOSE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        New Proposal
                    </button>
                </div>
            </div>

            <div className="p-6">
                {activeTab === "PROPOSE" ? (
                    <div className="max-w-md mx-auto space-y-4">
                        <div className="text-center mb-6">
                            <h4 className="font-bold text-slate-800">Propose a Name</h4>
                            <p className="text-sm text-slate-500">Be creative! A good acronym is key to a winning proposal.</p>
                        </div>
                        
                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Project Title</label>
                            <Input 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                placeholder="e.g. Erasmus Skills Development Platform"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-slate-500 mb-1 block">Acronym</label>
                            <Input 
                                value={acronym} 
                                onChange={e => setAcronym(e.target.value)} 
                                placeholder="e.g. ESKIP"
                            />
                        </div>

                        <Button onClick={handlePropose} disabled={isSubmitting || !title || !acronym} className="w-full">
                            {isSubmitting ? "Submitting..." : "Submit Proposal"}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {proposals.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 italic">
                                No proposals yet. Be the first to submit one!
                            </div>
                        ) : (
                            proposals.map((p, index) => {
                                const isMyProposal = p.userId === userId;
                                const myVote = p.votes.find((v: any) => v.userId === userId)?.stars || 0;

                                return (
                                    <div key={p.id} className={`relative flex items-center gap-4 p-4 rounded-lg border ${index < 3 ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}>
                                        {/* Rank Badge for top 3 */}
                                        {index < 3 && (
                                            <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm border border-white">
                                                {index + 1}
                                            </div>
                                        )}
                                        
                                        <div className="w-8 flex justify-center flex-shrink-0">
                                            {index >= 3 && <span className="font-mono text-slate-400 font-bold text-sm text-center w-full">#{index + 1}</span>}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0 px-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm flex-shrink-0 whitespace-nowrap uppercase tracking-wider">{p.acronym}</span>
                                                <h4 className="font-bold text-slate-800 truncate text-sm">{p.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap">
                                                <span className="flex items-center gap-1">
                                                    {p.user?.photo ? (
                                                        <img src={p.user.photo} alt={p.user.name || "User photo"} className="w-3 h-3 rounded-full object-cover" />
                                                    ) : (
                                                        <User size={10} />
                                                    )}
                                                    <span className="truncate">{p.user?.name} {p.user?.surname}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-0.5">
                                            {/* Star Rating Interaction - Smaller */}
                                            <div className="flex gap-0.5" onMouseLeave={() => {}}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button 
                                                        key={star}
                                                        onClick={() => !isMyProposal && handleVote(p.id, star)}
                                                        disabled={isMyProposal} 
                                                        className={`transition-all ${isMyProposal ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                                                        title={isMyProposal ? "You cannot vote for your own proposal" : `Vote ${star} stars`}
                                                    >
                                                        <Star 
                                                            size={14} 
                                                            className={star <= myVote ? "fill-yellow-400 text-yellow-500" : "text-slate-200"} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-medium">
                                                {p.voteCount} votes
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
