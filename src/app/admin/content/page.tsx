import { createClient } from "@/lib/supabase/server";
import ContentManagerTabs from "@/components/ContentManagerTabs";

type AboutContent = { title: string; body: string };
type QAItem = { question: string; answer: string };
type NewsPost = { id: string; title: string; body: string; published_at: string };

export default async function AdminContentPage() {
  const supabase = await createClient();

  const [{ data: aboutRow }, { data: faqRow }, { data: newsRow }, { data: glossaryRow }] =
    await Promise.all([
      supabase.from("site_content").select("content").eq("key", "about_us").single(),
      supabase.from("site_content").select("content").eq("key", "faq").single(),
      supabase.from("site_content").select("content").eq("key", "homepage_news").single(),
      supabase.from("site_content").select("content").eq("key", "glossary").single(),
    ]);

  const about: AboutContent = aboutRow?.content ?? { title: "About Us", body: "" };
  const faq: QAItem[] = Array.isArray(faqRow?.content) ? faqRow.content : [];
  const news: NewsPost[] = Array.isArray(newsRow?.content) ? newsRow.content : [];
  const glossary: QAItem[] = Array.isArray(glossaryRow?.content)
    ? glossaryRow.content
    : [];

  return (
    <div>
      <h2 className="text-xl font-semibold text-bolt-400">Site Content</h2>
      <p className="mt-1 text-sm text-gray-400">
        Changes save directly to the live site — no deploy needed.
      </p>
      <div className="mt-5">
        <ContentManagerTabs
          aboutTitle={about.title}
          aboutBody={about.body}
          faqItems={faq}
          glossaryItems={glossary}
          newsPosts={news}
        />
      </div>
    </div>
  );
}
