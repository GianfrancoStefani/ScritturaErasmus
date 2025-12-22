"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Bold, Italic, List, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Bold, Italic, List, Save } from 'lucide-react';

interface RichTextEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
}

export function RichTextEditor({ initialContent, onSave }: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent);

  // For MVP, using a textarea. In a real "Premium" app, we'd use Tiptap/Slate.
  // But to ensure it works right now without installing more packages:
  
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-shadow">
      <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50">
        <Button variant="ghost" size="sm" type="button" title="Bold"><Bold size={16} /></Button>
        <Button variant="ghost" size="sm" type="button" title="Italic"><Italic size={16} /></Button>
        <div className="w-px h-4 bg-slate-300 mx-1"></div>
        <Button variant="ghost" size="sm" type="button" title="List"><List size={16} /></Button>
        
        <div className="flex-1"></div>
        <span className="text-xs text-slate-400 mr-2">{content.length} chars</span>
      </div>
      <textarea
        className="w-full h-96 p-4 outline-none resize-none font-sans text-slate-700 leading-relaxed"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing here..."
      />
      <div className="p-2 border-t border-slate-100 flex justify-end">
         <Button onClick={() => onSave(content)} className="gap-2">
            <Save size={16} /> Save Content
         </Button>
      </div>
    </div>
  );
}
