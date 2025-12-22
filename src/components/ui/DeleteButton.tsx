"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
  onDelete: (id: string) => Promise<{ error?: string | null; success?: boolean }>;
  redirectAfter?: string;
  confirmMessage?: string;
  className?: string;
  requireConfirmationString?: string; // New: If needed, type this to confirm
}

export function DeleteButton({ 
  id, 
  onDelete, 
  redirectAfter, 
  confirmMessage = "Are you sure you want to delete this? This action cannot be undone.",
  className,
  requireConfirmationString
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (requireConfirmationString) {
        const userInput = prompt(`${confirmMessage}\n\nPlease type "${requireConfirmationString}" to confirm:`);
        if (userInput !== requireConfirmationString) {
             if (userInput !== null) alert("Confirmation failed. Incorrect text.");
             return;
        }
    } else {
        if (!confirm(confirmMessage)) return;
    }

    startTransition(async () => {
      const result = await onDelete(id);
      if (result.success && redirectAfter) {
        router.push(redirectAfter);
      } else {
         router.refresh();
      }
    });
  };

  return (
    <Button 
      variant="danger" 
      size="sm" 
      onClick={handleDelete} 
      disabled={isPending}
      className={className}
    >
      <Trash2 size={16} />
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}
