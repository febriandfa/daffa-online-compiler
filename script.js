const FILE_EXTENSIONS = {
  javascript: "js",
  go: "go",
  python: "py",
  php: "php",
  rust: "rs",
  java: "java",
};

const TEMPLATES = {
  javascript: `// JavaScript — Hello World
console.log("Hello, World!");`,

  go: `// Go — Hello World
package main

import "fmt"

func main() {
  fmt.Println("Hello, World!")
}`,

  python: `# Python — Hello World
print("Hello, World!")`,

  php: `<?php
// PHP — Hello World
echo "Hello, World!\\n";`,

  rust: `// Rust — Hello World
fn main() {
    println!("Hello, World!");
}`,

  java: `// Java — Hello World
public class main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
};

const LANG_COLORS = {
  javascript: "#f7df1e",
  go: "#00acd7",
  python: "#3572A5",
  php: "#8892be",
  rust: "#f74c00",
  java: "#b07219",
};

let runtimes = [];
let currentLang = "javascript";
let codes = {};

const editor = document.getElementById("code-editor");
const lineNumbers = document.getElementById("line-numbers");
const output = document.getElementById("output");
const runBtn = document.getElementById("run-btn");

async function loadRuntimes() {
  try {
    const res = await fetch("/api/v2/runtimes");
    if (!res.ok) throw new Error("Failed to fetch runtimes");
    const data = await res.json();

    const seen = new Set();
    runtimes = data.filter((r) => {
      if (seen.has(r.language)) return false;
      seen.add(r.language);
      return true;
    });

    buildLangTabs();
    initEditor();
  } catch (err) {
    console.error("Failed to load runtimes:", err);
    document.getElementById("status-api").textContent = "API Offline";

    runtimes = [{ language: "javascript", version: "20.11.1" }];
    buildLangTabs();
    initEditor();
  }
}

function buildLangTabs() {
  const langTabs = document.querySelector(".lang-tabs");
  langTabs.innerHTML = "";

  runtimes.forEach((rt, idx) => {
    const lang = rt.language;
    const color = LANG_COLORS[lang] || "#888";
    const btn = document.createElement("button");
    btn.className = `lang-btn${idx === 0 ? " active" : ""}`;
    btn.dataset.lang = lang;
    btn.onclick = () => switchLang(lang);
    btn.innerHTML = `<span class="dot" style="background:${color}"></span> ${capitalize(lang)}`;
    langTabs.appendChild(btn);

    codes[lang] = TEMPLATES[lang] || `// ${capitalize(lang)}\n`;
  });

  currentLang = runtimes[0]?.language || "javascript";
  updateAccentColor(currentLang);
}

function initEditor() {
  editor.value = codes[currentLang];
  updateLineNumbers();
  updateStatusBar();
}

function updateLineNumbers() {
  const lines = editor.value.split("\n").length;
  lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
}

editor.addEventListener("input", () => {
  codes[currentLang] = editor.value;
  updateLineNumbers();
});

editor.addEventListener("scroll", () => {
  lineNumbers.scrollTop = editor.scrollTop;
});

const PAIRS = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
};

const CLOSING = new Set([")", "]", "}", '"', "'", "`"]);

editor.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.slice(0, start) + "  " + editor.value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + 2;
    codes[currentLang] = editor.value;
    updateLineNumbers();
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    e.preventDefault();
    runCode();
    return;
  }

  if (PAIRS[e.key]) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const closing = PAIRS[e.key];
    const selected = editor.value.slice(start, end);

    if (start !== end) {
      e.preventDefault();
      const before = editor.value.slice(0, start);
      const after = editor.value.slice(end);
      editor.value = before + e.key + selected + closing + after;
      editor.selectionStart = start + 1;
      editor.selectionEnd = end + 1;
      codes[currentLang] = editor.value;
      updateLineNumbers();
      return;
    }

    const charAhead = editor.value[start];
    if ((e.key === '"' || e.key === "'" || e.key === "`") && charAhead === e.key) {
      e.preventDefault();
      editor.selectionStart = editor.selectionEnd = start + 1;
      return;
    }

    e.preventDefault();
    const before = editor.value.slice(0, start);
    const after = editor.value.slice(start);
    editor.value = before + e.key + closing + after;
    editor.selectionStart = editor.selectionEnd = start + 1;
    codes[currentLang] = editor.value;
    updateLineNumbers();
    return;
  }

  if (CLOSING.has(e.key)) {
    const start = editor.selectionStart;
    const charAhead = editor.value[start];
    if (charAhead === e.key && e.key !== '"' && e.key !== "'" && e.key !== "`") {
      e.preventDefault();
      editor.selectionStart = editor.selectionEnd = start + 1;
      return;
    }
  }

  if (e.key === "Backspace") {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end && start > 0) {
      const charBefore = editor.value[start - 1];
      const charAfter = editor.value[start];
      if (PAIRS[charBefore] && PAIRS[charBefore] === charAfter) {
        e.preventDefault();
        editor.value = editor.value.slice(0, start - 1) + editor.value.slice(start + 1);
        editor.selectionStart = editor.selectionEnd = start - 1;
        codes[currentLang] = editor.value;
        updateLineNumbers();
        return;
      }
    }
  }

  if (e.key === "Enter") {
    e.preventDefault();
    const start = editor.selectionStart;
    const textBefore = editor.value.slice(0, start);
    const textAfter = editor.value.slice(start);

    const currentLine = textBefore.split("\n").pop();
    const indent = currentLine.match(/^(\s*)/)[1];

    const charBefore = textBefore[textBefore.length - 1];
    const charAfter = textAfter[0];
    const isInsidePair = PAIRS[charBefore] && PAIRS[charBefore] === charAfter;

    if (isInsidePair) {
      const newValue = textBefore + "\n" + indent + "  " + "\n" + indent + textAfter;
      editor.value = newValue;
      editor.selectionStart = editor.selectionEnd = start + 1 + indent.length + 2;
    } else {
      editor.value = textBefore + "\n" + indent + textAfter;
      editor.selectionStart = editor.selectionEnd = start + 1 + indent.length;
    }

    codes[currentLang] = editor.value;
    updateLineNumbers();
    return;
  }
});

editor.addEventListener("keyup", updateCursor);
editor.addEventListener("click", updateCursor);

function updateCursor() {
  const text = editor.value.slice(0, editor.selectionStart);
  const lines = text.split("\n");
  document.getElementById("status-cursor").textContent = `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`;
}

function switchLang(lang) {
  codes[currentLang] = editor.value;
  currentLang = lang;

  document.querySelectorAll(".lang-btn").forEach((b) => b.classList.remove("active"));
  document.querySelector(`.lang-btn[data-lang="${lang}"]`).classList.add("active");

  updateAccentColor(lang);
  updateStatusBar();
  editor.value = codes[lang];
  updateLineNumbers();
  clearOutput();
}

function updateAccentColor(lang) {
  const color = LANG_COLORS[lang] || "#888";
  document.documentElement.style.setProperty("--accent-active", color);
  document.getElementById("status-lang").textContent = `● ${capitalize(lang)}`;
  document.getElementById("status-lang").style.color = color;

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const btnLang = btn.dataset.lang;
    const btnColor = LANG_COLORS[btnLang] || "#888";
    btn.querySelector(".dot").style.background = btnColor;
  });
}

function updateStatusBar() {
  const ext = FILE_EXTENSIONS[currentLang] || currentLang;
  document.getElementById("filename").textContent = `main.${ext}`;
  document.getElementById("status-lang").textContent = `● ${capitalize(currentLang)}`;
}

function toggleStdin() {
  const toggle = document.getElementById("stdin-toggle");
  const input = document.getElementById("stdin-input");
  toggle.classList.toggle("open");
  input.classList.toggle("visible");
}

function clearOutput() {
  output.innerHTML = '<div class="output-empty" id="output-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 5v14l11-7z"/></svg><p>Press <strong>RUN</strong> to execute your code</p></div>';
  document.getElementById("status-badge").style.display = "none";
  document.getElementById("exec-time").style.display = "none";
}

async function runCode() {
  const code = editor.value.trim();
  if (!code) return;

  const rt = runtimes.find((r) => r.language === currentLang);
  const stdin = document.getElementById("stdin-input").value;
  const ext = FILE_EXTENSIONS[currentLang] || currentLang;

  runBtn.classList.add("loading");
  runBtn.innerHTML = '<span class="spinner"></span> RUNNING';

  output.innerHTML = '<div class="output-info" style="padding:16px;color:var(--muted);font-size:12px;">⟳ Executing...</div>';
  document.getElementById("status-badge").style.display = "none";
  document.getElementById("exec-time").style.display = "none";

  const startTime = Date.now();

  try {
    const res = await fetch("/api/v2/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: rt.language,
        version: rt.version,
        files: [{ name: `main.${ext}`, content: code }],
        stdin: stdin || "",
      }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const elapsed = Date.now() - startTime;
    renderOutput(data, elapsed);
  } catch (err) {
    if (currentLang === "javascript") {
      runLocalJS(code, Date.now() - startTime);
    } else {
      output.innerHTML = "";
      appendLine(`<span class="output-stderr">✖ Network error: ${err.message}</span>\n`);
      appendLine(`<span class="output-info">Tip: Make sure Piston API is running.</span>`);
      setBadge(false);
    }
  } finally {
    runBtn.classList.remove("loading");
    runBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" style="width:14px;height:14px"><path d="M8 5v14l11-7z"/></svg> RUN';
  }
}

function renderOutput(data, elapsed) {
  const run = data.run || {};
  const compile = data.compile || {};
  output.innerHTML = "";

  if (compile.stderr) {
    appendLine(`<span class="output-stderr">${escHtml(compile.stderr)}</span>`);
  }
  if (run.stdout) {
    appendLine(`<span class="output-stdout">${escHtml(run.stdout)}</span>`);
  }
  if (run.stderr) {
    appendLine(`<span class="output-stderr">${escHtml(run.stderr)}</span>`);
  }
  if (!run.stdout && !run.stderr && !compile.stderr) {
    appendLine(`<span class="output-info">(no output)</span>`);
  }

  const success = run.code === 0 && !compile.stderr;
  setBadge(success);

  const timeEl = document.getElementById("exec-time");
  timeEl.textContent = `${elapsed}ms`;
  timeEl.style.display = "block";
}

function runLocalJS(code, elapsed) {
  output.innerHTML = "";
  appendLine(`<span class="output-info">ℹ Running locally in browser (no Piston API)\n</span>`);

  const logs = [];
  const origLog = console.log;
  const origError = console.error;

  console.log = (...args) => logs.push({ type: "log", msg: args.map(String).join(" ") });
  console.error = (...args) => logs.push({ type: "error", msg: args.map(String).join(" ") });

  let success = true;
  try {
    new Function(code)();
  } catch (e) {
    logs.push({ type: "error", msg: e.toString() });
    success = false;
  } finally {
    console.log = origLog;
    console.error = origError;
  }

  for (const log of logs) {
    if (log.type === "error") {
      appendLine(`<span class="output-stderr">${escHtml(log.msg)}</span>`);
    } else {
      appendLine(`<span class="output-stdout">${escHtml(log.msg)}</span>`);
    }
  }

  if (!logs.length) appendLine(`<span class="output-info">(no output)</span>`);

  setBadge(success);
  const timeEl = document.getElementById("exec-time");
  timeEl.textContent = `${Date.now() - elapsed}ms`;
  timeEl.style.display = "block";
}

function appendLine(html) {
  const span = document.createElement("span");
  span.innerHTML = html + "\n";
  output.appendChild(span);
}

function setBadge(ok) {
  const badge = document.getElementById("status-badge");
  badge.className = `output-badge ${ok ? "ok" : "fail"}`;
  badge.textContent = ok ? "OK" : "FAIL";
  badge.style.display = "inline-block";
}

function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") runCode();
});

loadRuntimes();
