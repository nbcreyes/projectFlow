"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, FolderKanban, CheckSquare, Clock, X, ArrowRight } from "lucide-react";

const RECENT_SEARCHES_KEY = "projectflow:recent-searches";
const MAX_RECENT = 5;

function loadRecentSearches() {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term) {
  try {
    const existing = loadRecentSearches().filter((s) => s !== term);
    const updated = [term, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {}
}

export default function SearchPage({ workspaceId }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debounceRef = useRef(null);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
    inputRef.current?.focus();
  }, []);

  const search = useCallback(
    async (q) => {
      if (q.length < 2) {
        setResults(null);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&workspaceId=${workspaceId}`
        );
        const data = await res.json();
        if (res.ok) {
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [workspaceId]
  );

  function handleQueryChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function clearQuery() {
    setQuery("");
    setResults(null);
    inputRef.current?.focus();
  }

  const allResults = results
    ? [
        ...results.tasks.map((t) => ({ type: "task", item: t })),
        ...results.projects.map((p) => ({ type: "project", item: p })),
      ]
    : [];

  function getHref(type, item) {
    if (type === "task") {
      return `/workspace/${workspaceId}/project/${item.project.id}/task/${item.id}`;
    }
    if (type === "project") {
      return `/workspace/${workspaceId}/project/${item.id}/board`;
    }
    return "#";
  }

  function navigate(type, item) {
    if (query.trim()) saveRecentSearch(query.trim());
    router.push(getHref(type, item));
  }

  function handleKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      const { type, item } = allResults[selectedIndex];
      navigate(type, item);
    }
  }

  const hasResults = results && allResults.length > 0;
  const noResults = results && allResults.length === 0 && query.length >= 2;

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">Search</h1>
        <p className="text-muted-foreground text-sm">
          Search tasks and projects in this workspace.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          placeholder="Search anything..."
          className="pl-9 pr-9 h-11 text-base"
        />
        {query && (
          <button
            onClick={clearQuery}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground text-center py-4">Searching...</p>
      )}

      {noResults && !isLoading && (
        <div className="text-center py-8">
          <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No results for "{query}"</p>
          <p className="text-xs text-muted-foreground mt-1">Try a different search term.</p>
        </div>
      )}

      {hasResults && !isLoading && (
        <div className="space-y-6">
          {results.tasks.length > 0 && (
            <ResultGroup
              title="Tasks"
              icon={CheckSquare}
              items={results.tasks}
              type="task"
              allResults={allResults}
              selectedIndex={selectedIndex}
              onNavigate={navigate}
              renderItem={(task) => (
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: task.project.color }}
                  >
                    {getInitials(task.project.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {task.project.name}{task.column ? ` · ${task.column.name}` : ""}
                    </p>
                  </div>
                </div>
              )}
            />
          )}

          {results.projects.length > 0 && (
            <ResultGroup
              title="Projects"
              icon={FolderKanban}
              items={results.projects}
              type="project"
              allResults={allResults}
              selectedIndex={selectedIndex}
              onNavigate={navigate}
              renderItem={(project) => (
                <div className="flex items-center gap-3">
                  <div
                    className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: project.color }}
                  >
                    {getInitials(project.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project._count.tasks} tasks</p>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}

      {!query && recentSearches.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Recent searches
          </p>
          <div className="space-y-1">
            {recentSearches.map((term) => (
              <button
                key={term}
                onClick={() => { setQuery(term); search(term); }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-md hover:bg-accent transition-colors text-sm"
              >
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-left">{term}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {!query && recentSearches.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Start typing to search across your workspace.
          </p>
        </div>
      )}
    </div>
  );
}

function ResultGroup({ title, icon: Icon, items, type, allResults, selectedIndex, onNavigate, renderItem }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
      </div>
      <div className="border rounded-lg overflow-hidden divide-y">
        {items.map((item) => {
          const globalIndex = allResults.findIndex(
            (r) => r.type === type && r.item.id === item.id
          );
          const isSelected = globalIndex === selectedIndex;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(type, item)}
              className={cn(
                "flex items-center gap-2 w-full px-4 py-3 text-left transition-colors",
                isSelected ? "bg-accent" : "hover:bg-muted/50"
              )}
            >
              <div className="flex-1 min-w-0">{renderItem(item)}</div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}