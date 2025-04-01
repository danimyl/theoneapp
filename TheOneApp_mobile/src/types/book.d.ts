/**
 * Type definitions for book data structures
 */

export interface Chapter {
  id: string;
  title: string;
  url: string;
}

export interface Book {
  id: string;
  title: string;
  url: string;
  chapters: Chapter[];
}

export interface Volume {
  id: string;
  title: string;
  books: Book[];
}

export interface BookContent {
  title: string;
  content: string;
  audioUrl: string | null;
  sourceUrl: string;
}
