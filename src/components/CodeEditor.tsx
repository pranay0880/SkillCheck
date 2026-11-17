"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  height?: number;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, label, height = 340, readOnly = false }: CodeEditorProps) {
  return (
    <div className="mb-3 overflow-hidden rounded-md border border-line" role="group" aria-label={label}>
      <Editor
        height={height}
        language="javascript"
        theme="light"
        value={value}
        onChange={(next) => onChange(next ?? "")}
        loading={<p className="p-4 text-muted">Loading editor…</p>}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 2,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          ariaLabel: label,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
