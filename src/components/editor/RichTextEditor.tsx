"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { useState, useCallback } from 'react';
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
    initialContent 
}: { 
    moduleId: string; 
    initialContent: string; 
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
        // If failed, we might want to keep it as 'unsaved' or retry. 
        // For simple UX, we leave it as saving or switch back to saved if we assume eventual consistency or manual retry.
        // Let's set to saved to clear the indicator, real error handling would require more UI.
    };

    const debouncedSave = useDebounceCallback(handleSave, 2000);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Typography,
            Placeholder.configure({
                placeholder: 'Start writing your module content here...',
            }),
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'editor-content-area', // We target prose via globals css rules on .ProseMirror
            },
        },
        onUpdate: ({ editor }) => {
            setStatus('unsaved');
            debouncedSave(editor.getHTML());
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="editor-container">
            {/* Toolbar */}
            <div className="editor-toolbar">
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
                
                <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

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

                <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 4px' }} />

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

                <div style={{ flex: 1 }} />

                <div className="flex items-center gap-2 mr-2">
                     <span style={{ 
                         fontSize: '0.75rem', 
                         fontWeight: 600, 
                         textTransform: 'uppercase',
                         color: status === 'saved' ? '#22c55e' : status === 'saving' ? '#f59e0b' : '#94a3b8'
                     }}>
                         {status === 'saved' ? "Saved" : status === 'saving' ? "Saving..." : "Unsaved"}
                     </span>
                </div>
            </div>

            {/* Editor Content */}
            <div className="editor-content">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
