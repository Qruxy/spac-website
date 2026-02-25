'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Eye,
  EyeOff,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const CONTENT_BLOCKS = [
  {
    label: '📢 Announcement',
    html: '<div style="border-left:4px solid #2563eb;padding:16px;background:#eff6ff;border-radius:4px"><h3 style="margin:0 0 8px">Announcement Title</h3><p>Your announcement text here.</p></div>',
  },
  {
    label: '📅 Event Block',
    html: '<div style="border:1px solid #e2e8f0;padding:16px;border-radius:8px"><h3 style="margin:0 0 4px">Event Name</h3><p style="margin:0;color:#64748b">📅 Date · 📍 Location</p><br/><a href="#" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Register Now</a></div>',
  },
  {
    label: '🔵 CTA Button',
    html: '<p style="text-align:center"><a href="https://stpeteastro.org" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px">Click Here</a></p>',
  },
  {
    label: '― Divider',
    html: '<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>',
  },
];

const TOKENS = ['{{firstName}}', '{{lastName}}', '{{email}}'];

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder: placeholder || 'Compose your email...' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] text-white',
      },
    },
    immediatelyRender: false,
  });

  // Sync external value changes (e.g. loading a template)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const setLink = () => {
    const previousUrl = editor?.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-slate-900/50">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-800/80 border-b border-white/10">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px bg-white/10 mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <span className="text-xs font-bold">H2</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <span className="text-xs font-bold">H3</span>
        </ToolbarButton>

        <div className="w-px bg-white/10 mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px bg-white/10 mx-1" />

        {/* Link */}
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive('link')}
          title="Insert Link"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px bg-white/10 mx-1" />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>

        <div className="flex-1" />

        {/* Preview toggle */}
        <ToolbarButton
          onClick={() => setShowPreview((v) => !v)}
          active={showPreview}
          title={showPreview ? 'Hide Preview' : 'Show Preview'}
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </ToolbarButton>
      </div>

      {/* Content Blocks row */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800/60 border-b border-white/10">
        <span className="text-xs text-slate-400 self-center mr-1">Blocks:</span>
        {CONTENT_BLOCKS.map((block) => (
          <button
            key={block.label}
            type="button"
            onClick={() => editor.chain().focus().insertContent(block.html).run()}
            className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors border border-white/10"
          >
            {block.label}
          </button>
        ))}
        <div className="w-px bg-white/10 mx-1" />
        <span className="text-xs text-slate-400 self-center mr-1">Tokens:</span>
        {TOKENS.map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => editor.chain().focus().insertContent(token).run()}
            className="px-2 py-1 text-xs rounded bg-indigo-900/50 hover:bg-indigo-800/60 text-indigo-300 transition-colors border border-indigo-500/30 font-mono"
          >
            {token}
          </button>
        ))}
      </div>

      {/* Editor content */}
      {!showPreview && (
        <div className="p-4 min-h-[200px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-500 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:text-white [&_.ProseMirror_p]:text-white [&_.ProseMirror_a]:text-blue-400 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_li]:text-white [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_u]:underline [&_.ProseMirror_hr]:border-white/20">
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Preview */}
      {showPreview && (
        <div className="p-4">
          <div className="bg-white rounded-lg overflow-hidden shadow-lg max-w-[600px] mx-auto">
            {/* Mock email header */}
            <div style={{ background: '#0f172a', padding: '24px', textAlign: 'center', borderBottom: '1px solid #334155' }}>
              <p style={{ color: '#60a5fa', margin: 0, fontSize: '20px', fontWeight: '700', fontFamily: 'sans-serif' }}>
                ✦ St. Petersburg Astronomy Club
              </p>
            </div>
            {/* Content */}
            <div
              style={{ padding: '32px 24px', background: '#fff', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', lineHeight: '1.6' }}
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
            {/* Mock footer */}
            <div style={{ background: '#0f172a', padding: '16px 24px', textAlign: 'center', borderTop: '1px solid #334155' }}>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '12px', fontFamily: 'sans-serif' }}>
                © {new Date().getFullYear()} St. Petersburg Astronomy Club · stpeteastro.org
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}
