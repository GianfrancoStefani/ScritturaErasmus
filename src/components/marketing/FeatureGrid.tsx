"use client";

import { useState } from "react";
import { X, ArrowRight, CheckCircle2 } from "lucide-react";
import { features, Feature } from "@/data/marketing-features";

export function FeatureGrid() {
    const [activeFeature, setActiveFeature] = useState<Feature | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left animate-fade-in animate-delay-300 max-w-7xl mx-auto">
                {features.map((feature, index) => (
                    <div 
                        key={index}
                        onClick={() => setActiveFeature(feature)}
                        className="group relative bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                    >
                        {/* Hover Gradient Background */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${feature.color.replace('bg-', 'bg-')}`}></div>
                        
                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-2xl ${feature.lightColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                <div className={`w-6 h-6 rounded-full ${feature.color} opacity-80`}></div>
                            </div>
                            
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                {feature.title}
                            </h3>
                            
                            <p className="text-slate-500 leading-relaxed mb-6 line-clamp-3">
                                {feature.longDesc}
                            </p>

                            <div className="flex items-center text-sm font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                Explore Feature <ArrowRight size={16} className="ml-2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

             {/* Modal Presentation */}
             {activeFeature && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
                    onClick={() => setActiveFeature(null)}
                >
                    <div 
                        className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 relative border border-white/20" 
                        onClick={e => e.stopPropagation()}
                    >
                         {/* Dynamic Header Color */}
                        <div className={`h-40 ${activeFeature.color} relative overflow-hidden flex items-end p-8`}>
                              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                              <div className="relative z-10">
                                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white/90 text-xs font-bold mb-3 backdrop-blur-md border border-white/10">
                                      FEATURE DEEP DIVE
                                  </div>
                                  <h3 className="text-4xl font-extrabold text-white tracking-tight">{activeFeature.title}</h3>
                              </div>
                              <button 
                                    onClick={() => setActiveFeature(null)} 
                                    className="absolute top-6 right-6 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-md transition-all"
                                    aria-label="Close modal"
                                >
                                    <X size={24} />
                                </button>
                        </div>

                        <div className="p-8">
                            <p className="text-xl text-slate-600 leading-relaxed font-light mb-8">
                                {activeFeature.longDesc}
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                {activeFeature.details.map((d, k) => (
                                    <div key={k} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 hover:bg-white hover:shadow-md hover:border-indigo-100 transition-all duration-300 group/item">
                                        <div className={`mt-0.5 w-6 h-6 rounded-full ${activeFeature.lightColor} text-indigo-600 flex-shrink-0 flex items-center justify-center group-hover/item:scale-110 transition-transform`}>
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <span className="font-medium text-base">{d}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button 
                                onClick={() => setActiveFeature(null)}
                                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2"
                            >
                                Close View <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
