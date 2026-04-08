'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  Eye, EyeOff, Minus, Image as ImageIcon, Loader2, ChevronDown,
} from 'lucide-react';

// ─── Inline FontSize extension (Tiptap v2, no extra package) ─────────────────
// Piggybacks on TextStyle — outputs <span style="font-size: X">
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
          renderHTML: (attrs) => attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) =>
        chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

// ─── Font size presets ────────────────────────────────────────────────────────
const FONT_SIZES = [
  { label: 'Small',   value: '0.8em'  },
  { label: 'Normal',  value: ''       },   // '' = remove / inherit
  { label: 'Large',   value: '1.2em'  },
  { label: 'X-Large', value: '1.5em'  },
  { label: 'Huge',    value: '2em'    },
];

interface PageContentEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function PageContentEditor({ value, onChange, placeholder, minHeight = 200 }: PageContentEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fontSizeOpen, setFontSizeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
      Placeholder.configure({ placeholder: placeholder || 'Write your content here… Use the toolbar to add headings, font sizes, links, and photos.' }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: 'prose prose-sm max-w-none focus:outline-none' } },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) editor.commands.setContent(value || '', false);
  }, [value, editor]);

  const setLink = () => {
    const prev = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter link URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor?.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleImageUpload = async (file: File) => {
    if (!editor) return;
    setUploading(true);
    try {
      const { uploadFile } = await import('@/lib/upload-file');
      const url = await uploadFile(file, 'richtext', 'inline');
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) { console.error('Image upload failed:', err); }
    finally { setUploading(false); }
  };

  const activeFontSize = editor?.getAttributes('textStyle').fontSize as string | undefined;
  const activeFontLabel = FONT_SIZES.find(f => f.value === (activeFontSize ?? ''))?.label ?? 'Size';

  if (!editor) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/40">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 bg-slate-800/80 border-b border-white/10">

        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon className="h-3.5 w-3.5" /></Btn>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Font size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setFontSizeOpen(v => !v)}
            title="Font size"
            className="flex items-center gap-1 px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <span className="min-w-[3.5rem] text-left">{activeFontLabel}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          {fontSizeOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-[7rem]">
              {FONT_SIZES.map(({ label, value }) => (
                <button key={label} type="button"
                  onClick={() => {
                    value ? editor.chain().focus().setFontSize(value).run()
                           : editor.chain().focus().unsetFontSize().run();
                    setFontSizeOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 transition-colors ${(activeFontSize ?? '') === value ? 'text-indigo-400 font-medium' : 'text-slate-200'}`}
                >
                  <span style={{ fontSize: value || '0.875rem' }}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2"><span className="text-[11px] font-bold">H2</span></Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3"><span className="text-[11px] font-bold">H3</span></Btn>

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

        <div className="w-px h-5 bg-white/10 mx-1" />

        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Insert photo"
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${uploading ? 'text-slate-500 cursor-wait' : 'text-orange-300 hover:bg-orange-500/20 hover:text-orange-200'}`}
        >
          {uploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Uploading…</span></> : <><ImageIcon className="h-3.5 w-3.5" /><span>Photo</span></>}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="sr-only"
          onChange={e => { const f = e.target.files?.[0]; if (f) void handleImageUpload(f); e.target.value = ''; }} />

        <div className="flex-1" />

        <button type="button" onClick={() => setShowPreview(v => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${showPreview ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          {showPreview ? <><EyeOff className="h-3.5 w-3.5" />Editing</> : <><Eye className="h-3.5 w-3.5" />Preview</>}
        </button>
      </div>

      {/* ── Editor ── */}
      {!showPreview && (
        <div style={{ minHeight }} onClick={() => fontSizeOpen && setFontSizeOpen(false)}
          className={`p-4
            [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-slate-100
            [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h2]:mt-4 [&_.ProseMirror_h2]:mb-2
            [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-white [&_.ProseMirror_h3]:mt-3 [&_.ProseMirror_h3]:mb-1
            [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_p]:min-h-[1.4em]
            [&_.ProseMirror_a]:text-blue-400 [&_.ProseMirror_a]:underline
            [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:mb-2
            [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:mb-2
            [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_hr]:border-white/20 [&_.ProseMirror_hr]:my-4
            [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic
            [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-3 [&_.ProseMirror_img]:block
            [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
            [&_.ProseMirror_.is-editor-empty:first-child::before]:text-slate-500
            [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left
            [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
          `}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {/* ── Preview ── */}
      {showPreview && (
        <div className="p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
            <div className="prose prose-sm max-w-none text-gray-800 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:my-3 [&_p:empty]:min-h-[1.2em]"
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }} />
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">Preview — how this content will appear on the site</p>
        </div>
      )}
    </div>
  );
}

function Btn({ onClick, active, title, children }: { onClick: () => void; active: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={`p-1.5 rounded transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
      {children}
    </button>
  );
}
