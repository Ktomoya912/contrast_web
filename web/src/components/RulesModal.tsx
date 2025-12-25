import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from '@/contexts/LanguageContext';
import React from 'react';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
    const { t } = useLanguage();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg bg-slate-900 border-white/10 text-white p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-4 border-b border-white/10 bg-slate-900/95 backdrop-blur z-10">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <span className="text-cyan-400 text-2xl">?</span> {t.rules.title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        {t.rules.objective}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] p-6">
                    <div className="space-y-8 pb-6">
                        {/* Goal */}
                        <section>
                            <h3 className="text-lg font-bold text-white mb-2 pb-1 border-b border-white/10">{t.rules.objectiveTitle}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {t.rules.objective}
                                <br />
                                <span className="text-xs text-gray-500 block mt-1">{t.rules.objectiveNote}</span>
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
                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shadow-inner shrink-0">
                                        {/* White Tile Visual */}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{t.rules.whiteTile}</h4>
                                        <p className="text-xs text-gray-400">{t.rules.whiteMove}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 rounded-lg bg-black flex items-center justify-center shadow-inner border border-white/10 shrink-0">
                                        {/* Black Tile Visual */}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">{t.rules.blackTile}</h4>
                                        <p className="text-xs text-gray-400">{t.rules.blackMove}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <div className="w-12 h-12 rounded-lg bg-slate-500 flex items-center justify-center shadow-inner border border-white/10 shrink-0">
                                        {/* Gray Tile Visual */}
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
                </ScrollArea>

                <DialogFooter className="p-4 border-t border-white/10 bg-slate-900/50">
                    <Button
                        onClick={onClose}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold"
                    >
                        {t.rules.gotIt}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RulesModal;

