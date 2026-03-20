"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/community/PostCard";
import { useSession } from "@/lib/auth-context";

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  authorName: string;
  commentCount: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "wins", label: "Wins" },
  { value: "questions", label: "Questions" },
  { value: "feature_requests", label: "Feature Requests" },
  { value: "general", label: "General" },
];

const CATEGORY_OPTIONS = [
  { value: "general", label: "General" },
  { value: "tips", label: "Tips & Tricks" },
  { value: "wins", label: "Wins" },
  { value: "questions", label: "Questions" },
  { value: "feature_requests", label: "Feature Requests" },
];

export default function CommunityPage() {
  const { user, isLoading: sessionLoading } = useSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      params.set("page", page.toString());

      const res = await fetch(`/api/community/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Failed to fetch community posts:", error);
    } finally {
      setLoading(false);
    }
  }, [category, search, page]);

  useEffect(() => {
    if (!sessionLoading) {
      fetchPosts();
    }
  }, [fetchPosts, sessionLoading]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput]
  );

  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value);
    setPage(1);
  }, []);

  const handleCreatePost = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim() || !newContent.trim() || submitting) return;

      setSubmitting(true);
      try {
        const res = await fetch("/api/community/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle.trim(),
            content: newContent.trim(),
            category: newCategory,
          }),
        });

        if (!res.ok) throw new Error("Failed to create post");

        setNewTitle("");
        setNewContent("");
        setNewCategory("general");
        setShowNewPost(false);
        fetchPosts();
      } catch (error) {
        console.error("Failed to create post:", error);
      } finally {
        setSubmitting(false);
      }
    },
    [newTitle, newContent, newCategory, submitting, fetchPosts]
  );

  if (sessionLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center" role="status" aria-label="Loading">
          <div className="text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header variant="minimal" />
        <main className="flex flex-1 items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
              <h2 className="text-lg font-semibold mb-2">Community Access Required</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Sign in to your Sovereign AI account to access the community forum.
              </p>
              <Link href="/login">
                <Button className="gradient-bg text-white">Sign In</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background page-enter">
      <Header variant="minimal" />

      <main className="flex-1 py-8">
        <Container>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold font-display">Community</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Share tips, celebrate wins, and connect with fellow business owners
              </p>
            </div>
            <Button
              onClick={() => setShowNewPost(!showNewPost)}
              className="gradient-bg text-white"
            >
              {showNewPost ? (
                <>
                  <X className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
                  New Post
                </>
              )}
            </Button>
          </div>

          {/* New Post Form */}
          {showNewPost && (
            <Card className="mb-6 border-primary/20">
              <CardContent className="p-5">
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <label htmlFor="new-post-category" className="block text-sm font-medium mb-1.5">Category</label>
                    <select
                      id="new-post-category"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-post-title" className="block text-sm font-medium mb-1.5">Title</label>
                    <input
                      id="new-post-title"
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="What's on your mind?"
                      className="w-full rounded-lg border border-border bg-background p-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label htmlFor="new-post-content" className="block text-sm font-medium mb-1.5">Content</label>
                    <textarea
                      id="new-post-content"
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Share your thoughts, tips, or questions..."
                      className="w-full rounded-lg border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[120px] resize-y"
                      maxLength={10000}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newTitle.trim() || !newContent.trim() || submitting}
                      className="gradient-bg text-white"
                    >
                      {submitting ? "Publishing..." : "Publish Post"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1" role="search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts..."
                  aria-label="Search community posts"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </form>
          </div>

          <Tabs value={category} onValueChange={handleCategoryChange} className="mb-6">
            <TabsList>
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Posts */}
          {loading ? (
            <div className="flex items-center justify-center py-12" role="status" aria-label="Loading posts">
              <div className="text-muted-foreground">Loading posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-3" aria-hidden="true" />
                <h3 className="text-sm font-semibold mb-1">No posts yet</h3>
                <p className="text-xs text-muted-foreground">
                  Be the first to share tips, ask questions, or start a conversation with fellow home service pros.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
