import Editor from "@monaco-editor/react";

export default function CodePane({ language, value, onChange }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <Editor
        height="440px"
        theme="vs-dark"
        defaultLanguage={language}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        options={{
          fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
        }}
      />
    </div>
  );
}
