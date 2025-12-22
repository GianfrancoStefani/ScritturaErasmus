"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  id: string;
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>;
  redirectAfter?: string;
  confirmMessage?: string;
  className?: string;
}

export function DeleteButton({ 
  id, 
  onDelete, 
  redirectAfter, 
  confirmMessage = "Are you sure you want to delete this? This action cannot be undone.",
  className 
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await onDelete(id);
      if (result.success && redirectAfter) {
        router.push(redirectAfter);
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
