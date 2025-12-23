"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import { useState, useCallback, useEffect } from 'react';
import { saveModuleContent } from '@/app/actions/editor';
import { 
    Bold, Italic, List, ListOrdered, Heading1, Heading2, 
    Quote
} from 'lucide-react';
import clsx from 'clsx';

// Simple inline debounce implementation
function useDebounceCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ) {
    const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  
    const debouncedCallback = useCallback(
      (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        const newTimer = setTimeout(() => {
          callback(...args);
        }, delay);
        setTimer(newTimer);
      },
      [callback, delay, timer]
    );
  
    return debouncedCallback;
}

const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children 
}: { 
    onClick: () => void, 
    isActive?: boolean, 
    disabled?: boolean, 
    children: React.ReactNode 
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={clsx("editor-btn", isActive && "active")}
    >
        {children}
    </button>
);

export function RichTextEditor({ 
    moduleId, 
    initialContent,
    maxChars,
    onContentChange
}: { 
    moduleId: string; 
    initialContent: string; 
    maxChars?: number;
    onContentChange?: (html: string) => void;
}) {
    const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

    const handleSave = async (html: string) => {
        setStatus('saving');
        const result = await saveModuleContent(moduleId, html);
        if (result.success) {
            setStatus('saved');
        } else {
            console.error("Failed to auto-save");
        }
    };

    const debouncedSave = useDebounceCallback(handleSave, 2000);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Typography,
            Placeholder.configure({
                placeholder: 'Start writing your module content here...',
            }),
            CharacterCount.configure({
                limit: maxChars,
            }),
        ],
        content: maxChars && initialContent.length > maxChars 
            ? initialContent.substring(0, maxChars) 
            : initialContent,
        editorProps: {
            attributes: {
                class: 'editor-content-area',
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            setStatus('unsaved');
            debouncedSave(html);
            if (onContentChange) onContentChange(html);
        },
        immediatelyRender: false,
    });

    // Sync content if it changes externally (e.g. after merge)
    useEffect(() => {
        if (editor && initialContent && editor.getHTML() !== initialContent) {
           // check if difference is meaningful to avoid cursor jumps or overwrites while typing
           // If we are "saving", we expect our content to be latest. 
           // If we are "saved" and prop changes, it implies external update (like merge).
           if (status === 'saved') {
               editor.commands.setContent(initialContent);
           }
        }
    }, [initialContent, editor, status]);

    if (!editor) {
        return null;
    }

    const percentage = maxChars 
        ? Math.round((100 / maxChars) * editor.storage.characterCount.characters()) 
        : 0;

    return (
        <div className="editor-container h-full flex flex-col">
            {/* Toolbar */}
            <div className="editor-toolbar flex-shrink-0">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                >
                    <Italic size={18} />
                </ToolbarButton>
                
                <div className="w-px h-6 bg-slate-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                >
                    <Heading1 size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                >
                    <Heading2 size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-slate-200 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                >
                    <ListOrdered size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                >
                    <Quote size={18} />
                </ToolbarButton>

                <div className="flex-1" />

                <div className="flex items-center gap-4 mr-2">
                    {maxChars && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                             <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={clsx("h-full transition-all", percentage > 95 ? "bg-red-500" : "bg-indigo-500")} 
                                    style={{ width: `${Math.min(percentage, 100)}%` }} 
                                />
                             </div>
                             <span>{editor.storage.characterCount?.characters() || 0} / {maxChars}</span>
                        </div>
                    )}
                     <span className={clsx(
                         "text-xs font-semibold uppercase",
                         status === 'saved' ? "text-green-500" : status === 'saving' ? "text-amber-500" : "text-slate-400"
                     )}>
                         {status === 'saved' ? "Saved" : status === 'saving' ? "Saving..." : "Unsaved"}
                     </span>
                </div>
            </div>

            {/* Editor Content */}
            <div className="editor-content flex-1 overflow-y-auto">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
