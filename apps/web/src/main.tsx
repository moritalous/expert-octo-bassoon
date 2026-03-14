import * as React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import "./index.css";
import indexJson from "../../../public/index.json";

type IndexItem = {
  date: string;
  themeId: string;
  themeName: string;
  title: string;
  path: string;
};

type IndexFile = {
  generatedAt: string | null;
  items: IndexItem[];
};

const markdownModules = import.meta.glob("../../../content/**/*.md", {
  query: "?raw",
  import: "default",
  eager: true
}) as Record<string, string>;

const markdownByPath = Object.fromEntries(
  Object.entries(markdownModules).map(([filePath, content]) => [filePath.replace("../../../", ""), content])
);
function App() {
  const [index, setIndex] = React.useState<IndexFile | null>(null);
  const [selected, setSelected] = React.useState<IndexItem | null>(null);
  const [markdown, setMarkdown] = React.useState<string>("");

  React.useEffect(() => {
    const items = [...(indexJson.items ?? [])].sort((a, b) => `${b.date}${b.themeId}`.localeCompare(`${a.date}${a.themeId}`));
    const data = { ...indexJson, items } as IndexFile;
    setIndex(data);
    setSelected(items[0] ?? null);
  }, []);

  React.useEffect(() => {
    if (!selected) {
      setMarkdown("");
      return;
    }
    setMarkdown(markdownByPath[selected.path] ?? "本文の読み込みに失敗しました。");
  }, [selected]);

  return (
    <main className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>最新 / 一覧</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(index?.items ?? []).map((item) => (
            <button
              key={`${item.date}-${item.themeId}`}
              className="w-full rounded border px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => setSelected(item)}
            >
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-slate-500">{item.date} / {item.themeName}</div>
            </button>
          ))}
          {index && index.items.length === 0 ? <p className="text-sm text-slate-500">記事がありません。</p> : null}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>{selected?.title ?? "Morning Brief"}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-800">{markdown || "記事を選択してください。"}</pre>
        </CardContent>
      </Card>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
