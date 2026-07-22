"use client";

import { useState } from "react";
import AboutUsEditor from "@/components/AboutUsEditor";
import QAListEditor from "@/components/QAListEditor";
import NewsPostEditor from "@/components/NewsPostEditor";
import { saveAboutUs, saveFaq, saveGlossary, saveNews } from "@/app/admin/content/actions";

type Tab = "about" | "faq" | "news" | "glossary";

type QAItem = { question: string; answer: string };
type NewsPost = { id: string; title: string; body: string; published_at: string };

export default function ContentManagerTabs({
  aboutTitle,
  aboutBody,
  faqItems,
  glossaryItems,
  newsPosts,
}: {
  aboutTitle: string;
  aboutBody: string;
  faqItems: QAItem[];
  glossaryItems: QAItem[];
  newsPosts: NewsPost[];
}) {
  const [tab, setTab] = useState<Tab>("about");

  const tabs: { key: Tab; label: string }[] = [
    { key: "about", label: "About Us" },
    { key: "faq", label: "FAQ" },
    { key: "news", label: "Homepage News" },
    { key: "glossary", label: "Glossary" },
  ];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === t.key
                ? "bg-bolt-500 text-storm-950"
                : "bg-storm-800 text-gray-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === "about" && (
          <AboutUsEditor
            initialTitle={aboutTitle}
            initialBody={aboutBody}
            onSave={saveAboutUs}
          />
        )}
        {tab === "faq" && (
          <QAListEditor
            initialItems={faqItems}
            questionLabel="Question"
            answerLabel="Answer"
            onSave={saveFaq}
          />
        )}
        {tab === "news" && (
          <NewsPostEditor initialPosts={newsPosts} onSave={saveNews} />
        )}
        {tab === "glossary" && (
          <QAListEditor
            initialItems={glossaryItems}
            questionLabel="Term"
            answerLabel="Definition"
            onSave={saveGlossary}
          />
        )}
      </div>
    </div>
  );
}
