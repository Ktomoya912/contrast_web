import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slideUp">
                
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400 text-2xl">?</span> {t.rules.title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    
                    {/* Goal */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">{t.rules.objectiveTitle}</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {t.rules.objective}
                            <br/>
                            <span className="text-xs text-gray-500">{t.rules.objectiveNote}</span>
                        </p>
                    </section>

                    {/* The Mechanic */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">{t.rules.movementTitle}</h3>
                        <p className="text-gray-300 text-sm mb-4">
                            {t.rules.movement}
                        </p>
                        
                        <div className="grid gap-3">
                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-inner">
                                    {/* <span className="text-2xl text-black">✜</span> */}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{t.rules.whiteTile}</h4>
                                    <p className="text-xs text-gray-400">{t.rules.whiteMove}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center shadow-inner border border-white/10">
                                    {/* <span className="text-2xl text-white">✖</span> */}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{t.rules.blackTile}</h4>
                                    <p className="text-xs text-gray-400">{t.rules.blackMove}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-slate-500 flex items-center justify-center shadow-inner border border-white/10">
                                    {/* <span className="text-2xl text-white">✳</span> */}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">{t.rules.grayTile}</h4>
                                    <p className="text-xs text-gray-400">{t.rules.grayMove}</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tile Placement */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">{t.rules.placementTitle}</h3>
                        <p className="text-gray-300 text-sm mb-3">
                            {t.rules.placement}
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-1">
                            {t.rules.placementList.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </section>
                    
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900/50 text-center">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors"
                    >
                        {t.rules.gotIt}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RulesModal;
