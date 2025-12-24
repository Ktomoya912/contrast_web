import React, { useEffect } from 'react';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative animate-slideUp">
                
                {/* Header */}
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-white/10 p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-cyan-400 text-2xl">?</span> How to Play
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
                        <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">1. Objective</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            Reach the opponent's back rank (the furthest row) with any of your pieces.
                            <br/>
                            <span className="text-xs text-gray-500">*First player to touch the goal line wins immediately.</span>
                        </p>
                    </section>

                    {/* The Mechanic */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">2. The "Contrast" Movement</h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Your movement options depend on the <strong>color of the tile</strong> your piece is currently standing on.
                        </p>
                        
                        <div className="grid gap-3">
                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-inner">
                                    {/* <span className="text-2xl text-black">✜</span> */}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">White Tile</h4>
                                    <p className="text-xs text-gray-400">Moves Orthogonally (Up, Down, Left, Right)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center shadow-inner border border-white/10">
                                    {/* <span className="text-2xl text-white">✖</span> */}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Black Tile</h4>
                                    <p className="text-xs text-gray-400">Moves Diagonally</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 rounded-lg bg-slate-500 flex items-center justify-center shadow-inner border border-white/10">
                                    {/* <span className="text-2xl text-white">✳</span> */}
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Gray Tile</h4>
                                    <p className="text-xs text-gray-400">Moves in all 8 directions (Queen-like)</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Tile Placement */}
                    <section>
                        <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">3. Modifying the Board</h3>
                        <p className="text-gray-300 text-sm mb-3">
                            When you move a piece, if you have tiles remaining, you can <strong>change the destination tile's color</strong>.
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 ml-1">
                            <li>You start with a limited number of Black and Gray tiles.</li>
                            <li>Use them to protect your pieces or trap your opponent!</li>
                            <li>Changing a tile is optional.</li>
                        </ul>
                    </section>
                    
                </div>
                
                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-900/50 text-center">
                    <button 
                        onClick={onClose}
                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-colors"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RulesModal;
