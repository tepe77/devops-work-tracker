import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { Badge } from "@/Components/ui/badge";
import { Archive, Trash2 } from "lucide-react";

export interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    variant?: "archive" | "destructive";
    badgeText?: string;
    loading?: boolean;
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText,
    cancelText = "Batal",
    variant = "destructive",
    badgeText,
    loading = false,
}: ConfirmDialogProps) {
    const isArchive = variant === "archive";
    const defaultConfirmText = isArchive ? "Ya, Arsipkan Data" : "Ya, Hapus Permanen";
    const defaultBadgeText = isArchive ? "Arsipkan (Soft Delete)" : "Hapus Permanen";

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader className="space-y-2">
                    <div className="flex items-center space-x-2">
                        {isArchive ? (
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <Archive className="w-4 h-4" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </div>
                        )}
                        <Badge variant={isArchive ? "warning" : "destructive"} className="text-[10px]">
                            {badgeText || defaultBadgeText}
                        </Badge>
                    </div>
                    <DialogTitle className="text-base font-semibold leading-tight text-foreground">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-border/60">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={isArchive ? "default" : "destructive"}
                        size="sm"
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        disabled={loading}
                        className={isArchive ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                    >
                        {confirmText || defaultConfirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
