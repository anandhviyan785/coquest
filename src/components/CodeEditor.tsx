import Editor from '@monaco-editor/react'
import type { BeforeMount } from '@monaco-editor/react'
import type { LangId } from '../lib/types'

const MONACO_LANG: Record<LangId, string> = {
  python: 'python', javascript: 'javascript', cpp: 'cpp', java: 'java', html: 'html', css: 'css', sql: 'sql',
}

/** A light editor theme built from the kit's palette. */
const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('coquest', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'AFAFAF', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1899D6', fontStyle: 'bold' },
      { token: 'string', foreground: '58A700' },
      { token: 'number', foreground: 'FF9600' },
      { token: 'type', foreground: 'A568CC' },
      { token: 'tag', foreground: '1899D6' },
      { token: 'attribute.name', foreground: 'A568CC' },
      { token: 'attribute.value', foreground: '58A700' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#3C3C3C',
      'editorLineNumber.foreground': '#CFCFCF',
      'editorLineNumber.activeForeground': '#777777',
      'editor.lineHighlightBackground': '#F7F7F7',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#DDF4FF',
      'editorCursor.foreground': '#1CB0F6',
      'editorIndentGuide.background1': '#EFEFEF',
      'editorGutter.background': '#FFFFFF',
      'scrollbarSlider.background': '#E5E5E599',
    },
  })
}

interface Props { lang: LangId; value: string; onChange: (code: string) => void; height?: number | string; readOnly?: boolean }

export function CodeEditor({ lang, value, onChange, height = 320, readOnly = false }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-line bg-white">
      <Editor
        height={height}
        language={MONACO_LANG[lang]}
        theme="coquest"
        value={value}
        beforeMount={defineTheme}
        onChange={(next) => onChange(next ?? '')}
        loading={<div className="label flex h-full items-center justify-center text-[13px] text-faint">Loading editor…</div>}
        options={{
          readOnly,
          fontFamily: "'JetBrains Mono Variable', Consolas, monospace",
          fontSize: 15,
          lineHeight: 24,
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          tabSize: lang === 'python' ? 4 : 2,
          insertSpaces: true,
          automaticLayout: true,
          padding: { top: 14, bottom: 14 },
          renderLineHighlight: 'line',
          overviewRulerLanes: 0,
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          wordWrap: lang === 'html' ? 'on' : 'off',
        }}
      />
    </div>
  )
}
