"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createStandardCost, deleteStandardCost, updateStandardCost } from "@/app/actions/costActions"; // Assume these exist
import { Edit, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface StandardCost {
    id: string;
    area: string;
    nation: string;
    role: string;
    dailyRate: number;
}

export function StandardCostList({ initialCosts }: { initialCosts: StandardCost[] }) {
    const [costs, setCosts] = useState(initialCosts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCost, setEditingCost] = useState<StandardCost | null>(null);

    // Form State
    const [formData, setFormData] = useState({ area: '', nation: '', role: '', dailyRate: 0 });

    const openCreate = () => {
        setEditingCost(null);
        setFormData({ area: '', nation: '', role: '', dailyRate: 0 });
        setIsModalOpen(true);
    };

    const openEdit = (cost: StandardCost) => {
        setEditingCost(cost);
        setFormData({ ...cost });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingCost) {
                await updateStandardCost(editingCost.id, formData);
                toast.success("Cost updated");
            } else {
                await createStandardCost(formData);
                toast.success("Cost created");
            }
            setIsModalOpen(false);
            window.location.reload(); 
        } catch (e) {
            toast.error("Operation failed");
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        await deleteStandardCost(id);
        toast.success("Cost deleted");
        window.location.reload();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between bg-slate-50">
                <h3 className="font-bold text-slate-700">Cost Matrix</h3>
                <Button size="sm" onClick={openCreate}><Plus size={16} className="mr-2" /> Add Cost</Button>
            </div>
            
            <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-4 py-3 font-medium">Area</th>
                        <th className="px-4 py-3 font-medium">Nation</th>
                        <th className="px-4 py-3 font-medium">Role</th>
                        <th className="px-4 py-3 font-medium text-right">Daily Rate (€)</th>
                        <th className="px-4 py-3 font-medium text-right">Est. Monthly</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {costs.map(cost => (
                        <tr key={cost.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-semibold text-slate-700">{cost.area}</td>
                            <td className="px-4 py-3">{cost.nation}</td>
                            <td className="px-4 py-3">{cost.role}</td>
                            <td className="px-4 py-3 text-right font-mono text-indigo-600">€ {cost.dailyRate.toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-slate-400 text-xs">€ {(cost.dailyRate * 21.5).toFixed(0)}</td>
                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                <button onClick={() => openEdit(cost)} className="text-slate-400 hover:text-indigo-600" title="Edit Cost"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(cost.id)} className="text-slate-400 hover:text-red-600" title="Delete Cost"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCost ? "Edit Cost" : "New Standard Cost"}>
                <div className="space-y-4 py-4">
                    {/* Inputs */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Area</label>
                        <input className="w-full border rounded p-2 text-sm" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="e.g. Area 1" aria-label="Area" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nation</label>
                        <input className="w-full border rounded p-2 text-sm" value={formData.nation} onChange={e => setFormData({...formData, nation: e.target.value})} placeholder="e.g. Italy" aria-label="Nation" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                        <input className="w-full border rounded p-2 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Senior Researcher" aria-label="Role" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Daily Rate (€)</label>
                        <input type="number" className="w-full border rounded p-2 text-sm" value={formData.dailyRate} onChange={e => setFormData({...formData, dailyRate: parseFloat(e.target.value)})} placeholder="0.00" aria-label="Daily Rate" />
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
