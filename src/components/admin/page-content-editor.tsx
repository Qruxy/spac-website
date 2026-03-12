'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Eye, EyeOff, Minus,
} from 'lucide-react';

interface PageContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function PageContentEditor({ value, onChange, placeholder, minHeight = 200 }: PageContentEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Placeholder.configure({ placeholder: placeholder || 'Start writing...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const setLink = () => {
    const prev = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter link URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor?.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-slate-800/80 border-b border-white/10">
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading"><span className="text-[11px] font-bold">H2</span></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Subheading"><span className="text-[11px] font-bold">H3</span></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list"><List className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn onClick={setLink} active={editor.isActive('link')} title="Insert link"><LinkIcon className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Divider line"><Minus className="h-3.5 w-3.5" /></Btn>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <Btn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight className="h-3.5 w-3.5" /></Btn>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowPreview(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          {showPreview ? <><EyeOff className="h-3.5 w-3.5" />Editing</> : <><Eye className="h-3.5 w-3.5" />Preview</>}
        </button>
      </div>

      {/* Editor */}
      {!showPreview && (
        <div
          style={{ minHeight }}
          className={`p-4
            [&_.ProseMirror]:outline-none
            [&_.ProseMirror]:text-slate-100
            [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2
            [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-white [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1
            [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_p]:mb-2
            [&_.ProseMirror_a]:text-blue-400 [&_.ProseMirror_a]:underline
            [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-2
            [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-2
            [&_.ProseMirror_li]:mb-1
            [&_.ProseMirror_hr]:border-white/20 [&_.ProseMirror_hr]:my-4
            [&_.ProseMirror_strong]:font-bold
            [&_.ProseMirror_em]:italic
            [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_.is-editor-empty:first-child::before]:text-slate-500
            [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
          `}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Preview — renders like actual site content */}
      {showPreview && (
        <div className="p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
            <div
              className="prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">Preview — how this content will appear on the site</p>
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, active, title, children }: { onClick: () => void; active: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
    >
      {children}
    </button>
  );
}
