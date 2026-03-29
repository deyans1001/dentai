"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { MarketingPost } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentStatus {
  name: string;
  description: string;
  status: "active" | "idle" | "error";
  lastRun: string;
  nextRun: string;
}

const AGENTS: AgentStatus[] = [
  {
    name: "Agent 1 — Изследване",
    description: "Анализира тенденции в дентална медицина",
    status: "active",
    lastRun: "Преди 2 часа",
    nextRun: "След 22 часа",
  },
  {
    name: "Agent 2 — Създаване",
    description: "Генерира съдържание за социални мрежи",
    status: "idle",
    lastRun: "Преди 6 часа",
    nextRun: "След 18 часа",
  },
  {
    name: "Agent 3 — Публикуване",
    description: "Публикува и проследява engagement",
    status: "idle",
    lastRun: "Преди 6 часа",
    nextRun: "След 18 часа",
  },
];

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  idle: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активен",
  idle: "В изчакване",
  error: "Грешка",
};

export default function AdminMarketingPage() {
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from("marketing_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setPosts((data || []) as MarketingPost[]);
    setLoading(false);
  }

  const PLATFORM_LABELS: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    linkedin: "LinkedIn",
  };

  const POST_STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-slate-500/20 text-slate-400",
    SCHEDULED: "bg-blue-500/20 text-blue-400",
    PUBLISHED: "bg-green-500/20 text-green-400",
    FAILED: "bg-red-500/20 text-red-400",
  };

  const POST_STATUS_LABELS: Record<string, string> = {
    DRAFT: "Чернова",
    SCHEDULED: "Планиран",
    PUBLISHED: "Публикуван",
    FAILED: "Грешка",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-white">Маркетинг</h1>
        <p className="text-slate-400 text-sm mt-1">AI агенти за съдържание в социални мрежи</p>
      </div>

      {/* Agent status panels */}
      <div className="grid md:grid-cols-3 gap-4">
        {AGENTS.map((agent, i) => (
          <div key={i} className="bg-dark-800 border border-white/8 rounded-2xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-white font-medium text-sm">{agent.name}</p>
                <p className="text-slate-500 text-xs mt-0.5">{agent.description}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[agent.status]}`}>
                {STATUS_LABELS[agent.status]}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-500">
              <p>Последно: {agent.lastRun}</p>
              <p>Следващо: {agent.nextRun}</p>
            </div>
            {agent.status === "active" && (
              <div className="mt-3 h-1 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-green animate-shimmer" style={{ width: "60%" }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Posts list */}
      <div className="bg-dark-800 border border-white/8 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-white font-semibold">Съдържание ({posts.length})</h2>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📱</div>
            <p className="text-slate-400">Няма публикувано съдържание</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-white/2 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-slate-500 text-xs">{PLATFORM_LABELS[post.platform]}</span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">
                        {post.scheduled_for ? formatDateTime(post.scheduled_for) : formatDateTime(post.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${POST_STATUS_COLORS[post.status]}`}>
                    {POST_STATUS_LABELS[post.status]}
                  </span>
                </div>
                {post.engagement_metrics && Object.keys(post.engagement_metrics).length > 0 && (
                  <div className="flex gap-4 mt-2 text-xs text-slate-500">
                    {post.engagement_metrics.likes && <span>❤️ {post.engagement_metrics.likes}</span>}
                    {post.engagement_metrics.comments && <span>💬 {post.engagement_metrics.comments}</span>}
                    {post.engagement_metrics.shares && <span>↗️ {post.engagement_metrics.shares}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
