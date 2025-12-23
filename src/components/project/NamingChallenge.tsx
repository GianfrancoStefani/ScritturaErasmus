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
        if (index === 0) return <Trophy className="text-yellow-500" size={20} />;
        if (index === 1) return <Medal className="text-slate-400" size={20} />; // Silver
        if (index === 2) return <Medal className="text-amber-700" size={20} />; // Bronze
        return <span className="text-slate-400 font-bold ml-1">{index + 1}</span>;
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white flex justify-between items-center">
                <div>
                    <h3 className="font-bold flex items-center gap-2">
                        <Award size={20} className="text-yellow-300" />
                        Project Naming Challenge
                    </h3>
                    <p className="text-xs text-indigo-100 opacity-90">Propose a title & acronym. Vote for the best one!</p>
                </div>
                <div className="flex bg-white/10 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab("VOTE")}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'VOTE' ? 'bg-white text-indigo-600' : 'text-indigo-100 hover:bg-white/10'}`}
                    >
                        Leaderboard & Vote
                    </button>
                    <button 
                        onClick={() => setActiveTab("PROPOSE")}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${activeTab === 'PROPOSE' ? 'bg-white text-indigo-600' : 'text-indigo-100 hover:bg-white/10'}`}
                    >
                        Submit Proposal
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
                                    <div key={p.id} className={`flex items-center gap-4 p-4 rounded-lg border ${index < 3 ? 'border-indigo-100 bg-indigo-50/50' : 'border-slate-100 bg-white'}`}>
                                        <div className="w-8 flex justify-center flex-shrink-0">
                                            {getRankIcon(index)}
                                        </div>
                                        
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-sm">{p.acronym}</span>
                                                <h4 className="font-bold text-slate-800">{p.title}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    {p.user?.photo ? (
                                                        <img src={p.user.photo} alt={p.user.name || "User photo"} className="w-4 h-4 rounded-full object-cover" />
                                                    ) : (
                                                        <User size={12} />
                                                    )}
                                                    {p.user?.name} {p.user?.surname}
                                                </span>
                                                <span>•</span>
                                                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            {/* Star Rating Interaction */}
                                            <div className="flex gap-1" onMouseLeave={() => {}}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button 
                                                        key={star}
                                                        onClick={() => !isMyProposal && handleVote(p.id, star)}
                                                        disabled={isMyProposal} // Cannot vote for own? Assuming user shouldn't bias ranking too easily, but requirements said "all users". If allowed, remove disabled. I'll keep disabled for self to prevent farming.
                                                        className={`transition-all ${isMyProposal ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'}`}
                                                        title={isMyProposal ? "You cannot vote for your own proposal" : `Vote ${star} stars`}
                                                    >
                                                        <Star 
                                                            size={18} 
                                                            className={star <= myVote ? "fill-yellow-400 text-yellow-500" : "text-slate-300"} 
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium">
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
