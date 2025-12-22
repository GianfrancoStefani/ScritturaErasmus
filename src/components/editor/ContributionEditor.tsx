"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useState } from 'react';
import { Bold, Italic, List, Send, X } from 'lucide-react';
import clsx from 'clsx';
import { Button } from '@/components/ui/Button';

const ToolbarButton = ({ onClick, isActive = false, children }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={clsx("p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-500", isActive && "bg-slate-200 text-slate-900")}
    >
        {children}
    </button>
);

export function ContributionEditor({ onSubmit, onCancel }: { onSubmit: (html: string) => void, onCancel: () => void }) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: 'Write your contribution...' }),
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'min-h-[100px] w-full p-3 focus:outline-none prose prose-sm max-w-none',
            },
        },
    });

    if (!editor) return null;

    return (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden mb-4 animate-in fade-in zoom-in-95 duration-200">
             <div className="flex items-center gap-1 border-b bg-slate-50 p-1">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')}><Bold size={16} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')}><Italic size={16} /></ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')}><List size={16} /></ToolbarButton>
                <div className="flex-1" />
                <button onClick={onCancel} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <EditorContent editor={editor} />
            <div className="p-2 border-t flex justify-end">
                <Button size="sm" onClick={() => {
                    const html = editor.getHTML();
                    if (editor.getText().trim()) onSubmit(html);
                }}>
                    <Send size={14} className="mr-2" /> Submit
                </Button>
            </div>
        </div>
    );
}
