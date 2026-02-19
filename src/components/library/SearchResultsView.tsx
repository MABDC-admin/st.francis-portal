import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Search, 
  Sparkles,
  Tag,
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { BookSearchResult, SearchMatch } from '@/hooks/useBookSearch';
import { cn } from '@/lib/utils';

interface SearchResultsViewProps {
  query: string;
  results: BookSearchResult[];
  totalMatches: number;
  isSearching: boolean;
  onBack: () => void;
  onOpenBook: (bookId: string, pageNumber: number, bookTitle: string) => void;
}

export const SearchResultsView = ({
  query,
  results,
  totalMatches,
  isSearching,
  onBack,
  onOpenBook,
}: SearchResultsViewProps) => {
  const [expandedBooks, setExpandedBooks] = useState<Set<string>>(new Set(results.map(r => r.book_id)));

  const toggleBook = (bookId: string) => {
    setExpandedBooks(prev => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  // Highlight search terms in text
  const highlightText = (text: string) => {
    // Replace **text** with highlighted spans
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <mark key={i} className="bg-primary/30 text-foreground px-0.5 rounded">
            {part.slice(2, -2)}
          </mark>
        );
      }
      return part;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Search Results
          </h1>
          <p className="text-muted-foreground mt-1">
            {isSearching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </span>
            ) : (
              <>
                Found <span className="font-semibold text-foreground">{totalMatches}</span> matches 
                in <span className="font-semibold text-foreground">{results.length}</span> books 
                for "<span className="text-primary">{query}</span>"
              </>
            )}
          </p>
        </div>
      </div>

      {/* Results */}
      {isSearching ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Searching through book content...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground max-w-md">
            Try different keywords or check if the books have been indexed for AI search.
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="space-y-4 pr-4">
            <AnimatePresence>
              {results.map((book, bookIndex) => (
                <motion.div
                  key={book.book_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: bookIndex * 0.05 }}
                >
                  <Card className="overflow-hidden">
                    <Collapsible
                      open={expandedBooks.has(book.book_id)}
                      onOpenChange={() => toggleBook(book.book_id)}
                    >
                      {/* Book Header */}
                      <CollapsibleTrigger asChild>
                        <button className="w-full text-left">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {/* Book Cover */}
                              <div className="flex-shrink-0 w-16 h-20 rounded-md overflow-hidden bg-muted">
                                {book.cover_url ? (
                                  <img
                                    src={book.cover_url}
                                    alt={book.book_title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                                  </div>
                                )}
                              </div>

                              {/* Book Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <h3 className="font-semibold text-foreground line-clamp-1">
                                      {book.book_title}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="text-xs">
                                        Grade {book.grade_level}
                                      </Badge>
                                      {book.subject && (
                                        <Badge variant="outline" className="text-xs">
                                          {book.subject}
                                        </Badge>
                                      )}
                                      <span className="text-sm text-muted-foreground">
                                        {book.matches.length} match{book.matches.length !== 1 ? 'es' : ''}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {expandedBooks.has(book.book_id) ? (
                                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </button>
                      </CollapsibleTrigger>

                      {/* Page Matches */}
                      <CollapsibleContent>
                        <div className="border-t">
                          {book.matches.slice(0, 10).map((match, matchIndex) => (
                            <div
                              key={`${match.page_id}-${matchIndex}`}
                              className={cn(
                                "px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer",
                                matchIndex !== book.matches.length - 1 && "border-b"
                              )}
                              onClick={() => onOpenBook(book.book_id, match.page_number, book.book_title)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                                  <span className="text-sm font-bold text-primary">
                                    {match.page_number}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  {match.chapter_title && (
                                    <p className="text-sm font-medium text-foreground mb-1">
                                      {match.chapter_title}
                                    </p>
                                  )}
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {highlightText(match.snippet)}
                                  </p>
                                  {match.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {match.topics.slice(0, 3).map((topic, i) => (
                                        <Badge 
                                          key={i} 
                                          variant="secondary" 
                                          className="text-xs gap-1"
                                        >
                                          <Tag className="h-2.5 w-2.5" />
                                          {topic}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenBook(book.book_id, match.page_number, book.book_title);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-1" />
                                  Open
                                </Button>
                              </div>
                            </div>
                          ))}
                          {book.matches.length > 10 && (
                            <div className="px-4 py-2 text-center text-sm text-muted-foreground bg-muted/30">
                              + {book.matches.length - 10} more matches
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </motion.div>
  );
};
