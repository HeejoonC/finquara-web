'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Color } from '@tiptap/extension-color'
import { Image } from '@tiptap/extension-image'
import { Extension } from '@tiptap/core'
import { useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Custom FontSize extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize:
        () =>
        ({ chain }: any) =>
          chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const FONT_FAMILIES = [
  { label: '기본', value: '' },
  { label: '맑은 고딕', value: '"Malgun Gothic", sans-serif' },
  { label: '나눔고딕', value: '"Nanum Gothic", sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: '"Courier New", monospace' },
]

const FONT_SIZES = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px']

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      FontSize,
      Image.configure({ inline: false, allowBase64: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose-editorial max-w-none min-h-[400px] focus:outline-none px-5 py-4',
      },
    },
  })

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return
      const ext = file.name.split('.').pop()
      const filename = `job-images/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('public-assets')
        .upload(filename, file, { upsert: true })

      if (error) {
        // fallback to base64
        const reader = new FileReader()
        reader.onload = (e) => {
          const src = e.target?.result as string
          editor.chain().focus().setImage({ src }).run()
        }
        reader.readAsDataURL(file)
        return
      }
      const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(data.path)
      editor.chain().focus().setImage({ src: urlData.publicUrl }).run()
    },
    [editor, supabase]
  )

  if (!editor) return null

  const toolbarBtn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2.5 py-1.5 text-[0.8rem] font-medium transition-colors ${
        active ? 'bg-ink text-bg' : 'text-ink-soft hover:text-ink'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-line-strong focus-within:border-ink">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-line bg-bg-strong px-3 py-2">
        {/* Font Family */}
        <select
          title="글꼴"
          onChange={(e) => {
            if (e.target.value) {
              editor.chain().focus().setFontFamily(e.target.value).run()
            } else {
              editor.chain().focus().unsetFontFamily().run()
            }
          }}
          className="border border-line-strong bg-bg px-2 py-1 text-xs text-ink focus:outline-none"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Font Size */}
        <select
          title="글자 크기"
          onChange={(e) => {
            if (e.target.value) {
              ;(editor.chain().focus() as any).setFontSize(e.target.value).run()
            } else {
              ;(editor.chain().focus() as any).unsetFontSize().run()
            }
          }}
          className="w-20 border border-line-strong bg-bg px-2 py-1 text-xs text-ink focus:outline-none"
        >
          <option value="">크기</option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div className="mx-1 h-4 w-px bg-line-strong" />

        {/* Headings */}
        {([1, 2, 3] as const).map((level) =>
          toolbarBtn(
            editor.isActive('heading', { level }),
            () => editor.chain().focus().toggleHeading({ level }).run(),
            `제목 ${level}`,
            `H${level}`
          )
        )}

        <div className="mx-1 h-4 w-px bg-line-strong" />

        {/* Bold / Italic / Underline / Strike */}
        {toolbarBtn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), '굵게 (Ctrl+B)', <strong>B</strong>)}
        {toolbarBtn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), '기울임 (Ctrl+I)', <em>I</em>)}
        {toolbarBtn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), '밑줄', <span className="underline">U</span>)}
        {toolbarBtn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), '취소선', <span className="line-through">S</span>)}

        <div className="mx-1 h-4 w-px bg-line-strong" />

        {/* Lists */}
        {toolbarBtn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), '목록', '≡')}
        {toolbarBtn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), '번호 목록', '①')}

        <div className="mx-1 h-4 w-px bg-line-strong" />

        {/* Text Color */}
        <label title="글자 색상" className="relative flex cursor-pointer items-center gap-0.5 px-2 py-1.5 text-[0.8rem] text-ink-soft hover:text-ink">
          A
          <input
            type="color"
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            title="글자 색상"
          />
          <span
            className="mt-0.5 block h-1 w-3"
            style={{ backgroundColor: editor.getAttributes('textStyle').color || '#111111' }}
          />
        </label>

        <div className="mx-1 h-4 w-px bg-line-strong" />

        {/* Image Upload */}
        <button
          type="button"
          title="이미지 삽입"
          onClick={() => fileInputRef.current?.click()}
          className="px-2.5 py-1.5 text-[0.8rem] text-ink-soft transition-colors hover:text-ink"
        >
          🖼
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />

        <div className="mx-1 h-4 w-px bg-line-strong" />

        {/* Undo / Redo */}
        <button
          type="button"
          title="실행 취소"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="px-2.5 py-1.5 text-[0.8rem] text-ink-soft hover:text-ink disabled:opacity-30"
        >
          ↩
        </button>
        <button
          type="button"
          title="다시 실행"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="px-2.5 py-1.5 text-[0.8rem] text-ink-soft hover:text-ink disabled:opacity-30"
        >
          ↪
        </button>
      </div>

      {/* Editor area */}
      <div className="relative bg-bg">
        {!value || value === '<p></p>' ? (
          <p className="pointer-events-none absolute left-5 top-4 select-none text-[0.98rem] text-muted opacity-70">
            {placeholder}
          </p>
        ) : null}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
