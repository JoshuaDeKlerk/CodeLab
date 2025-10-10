export function setupMonaco(monaco) {
  monaco.editor.defineTheme("codelab-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", background: "0B0F14" },
      { token: "string", foreground: "C3E88D" },
      { token: "keyword", foreground: "C792EA" },
      { token: "number", foreground: "F78C6C" },
      { token: "comment", foreground: "546E7A" },
      { token: "type", foreground: "82AAFF" },
      { token: "function", foreground: "89DDFF" },
    ],
    colors: {
      "editor.background": "#0B0F14",
      "editor.foreground": "#FEFEFE",
      "editor.lineHighlightBackground": "#1E293B80",
      "editor.selectionBackground": "#4DA3FF40",
      "editorCursor.foreground": "#4DA3FF",
      "editorWhitespace.foreground": "#E2E8F033",
      "editorLineNumber.foreground": "#94A3B877",
      "editorLineNumber.activeForeground": "#4DA3FF",
      "editorIndentGuide.background": "#FFFFFF22",
      "editorIndentGuide.activeBackground": "#FFFFFF44",
    },
  });
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowJs: true,
    checkJs: false,
    noEmit: true,
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  });
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: false,
    noSyntaxValidation: false,
  });
}
