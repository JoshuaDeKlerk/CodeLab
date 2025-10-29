import Editor from "@monaco-editor/react";
import { setupMonaco } from "../monaco/setup";

export default function CodePane({ language, value, onChange, onRun }) {
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <Editor
        height="440px"
        theme="codelab-dark"
        defaultLanguage={language}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        beforeMount={setupMonaco}
        onMount={(editor, monaco) => {
          if (onRun) {
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
              () => onRun()
            );
          }
          // Alt+Z to toggle word wrap
          editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
            const opts = editor.getRawOptions();
            editor.updateOptions({ wordWrap: opts.wordWrap === "on" ? "off" : "on" });
          });
        }}
        options={{
          fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          tabSize: 2,
          automaticLayout: true, 
          smoothScrolling: true,
        }}
      />
    </div>
  );
}
