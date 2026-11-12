import Editor from '@monaco-editor/react'
import type { BeforeMount } from '@monaco-editor/react'
import type { LangId } from '../lib/types'

const MONACO_LANG: Record<LangId, string> = {
  python: 'python', javascript: 'javascript', cpp: 'cpp', java: 'java', html: 'html', css: 'css', sql: 'sql',
}

const defineTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('pyquest', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '5B6B88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '67E8F9' },
      { token: 'string', foreground: 'FBBF24' },
      { token: 'number', foreground: 'F97316' },
      { token: 'type', foreground: '7DD3FC' },
      { token: 'tag', foreground: '67E8F9' },
      { token: 'attribute.name', foreground: '7DD3FC' },
    ],
    colors: {
      'editor.background': '#0B1120',
      'editor.foreground': '#E2E8F0',
      'editorLineNumber.foreground': '#3A4A6B',
      'editorLineNumber.activeForeground': '#94A3B8',
      'editor.lineHighlightBackground': '#111A2E',
      'editor.selectionBackground': '#2563EB55',
      'editorCursor.foreground': '#67E8F9',
      'editorIndentGuide.background1': '#1B2942',
      'editorGutter.background': '#0B1120',
      'scrollbarSlider.background': '#23335480',
    },
  })
}

interface Props { lang: LangId; value: string; onChange: (code: string) => void; height?: number | string; readOnly?: boolean }

export function CodeEditor({ lang, value, onChange, height = 320, readOnly = false }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#0B1120]">
      <Editor
        height={height}
        language={MONACO_LANG[lang]}
        theme="pyquest"
        value={value}
        beforeMount={defineTheme}
        onChange={(next) => onChange(next ?? '')}
        loading={<div className="flex h-full items-center justify-center text-sm text-faint">Loading editor…</div>}
        options={{
          readOnly,
          fontFamily: "'JetBrains Mono Variable', Consolas, monospace",
          fontSize: 14,
          lineHeight: 22,
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
