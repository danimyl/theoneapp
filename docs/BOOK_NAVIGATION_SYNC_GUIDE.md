# Book Navigation Synchronization Guide

This guide explains how the book navigation system works in TheOneApp and how to synchronize data between the web app and mobile app.

## Overview

The book navigation system displays a hierarchical structure of volumes, books, and chapters from "The New Message from God" book collection. The data is organized as follows:

- **Volumes**: Top-level containers (e.g., "Volume 1")
- **Books**: Collections of chapters within a volume (e.g., "The One God")
- **Chapters**: Individual content pages (e.g., "Comprehending God")

## Data Files

The book navigation system uses the following key files:

1. **scraped-navigation.json**: The primary navigation data file containing the hierarchical structure of volumes, books, and chapters. This file is used by both the web app and mobile app.

2. **content/*.json**: Individual JSON files for each chapter's content, stored in the `content` directory.

## Data Structure

The navigation data follows this structure:

```typescript
interface Volume {
  id: string;       // e.g., "volume-1"
  title: string;    // e.g., "Volume 1"
  url?: string;     // Optional URL to the volume page
  books: Book[];    // Array of books in this volume
}

interface Book {
  id: string;       // e.g., "one-god"
  title: string;    // e.g., "The One God"
  url: string;      // URL to the book page
  chapters: Chapter[]; // Array of chapters in this book
}

interface Chapter {
  id: string;       // e.g., "comprehending-god"
  title: string;    // e.g., "Comprehending God"
  url: string;      // URL to the chapter page
}

interface BookContent {
  title: string;    // Chapter title
  content: string;  // HTML content of the chapter
  audioUrl: string | null; // URL to audio version (if available)
  sourceUrl: string; // Original source URL
}
```

## Synchronization Process

The synchronization process copies the navigation data and content files from the web app to the mobile app. This is done using the `sync-book-data.mjs` script.

### How to Run the Sync Script

```bash
# From the project root directory
node sync-book-data.mjs
```

### What the Sync Script Does

1. **Copies scraped-navigation.json**: The script copies the navigation data from `src/data/book/scraped-navigation.json` to `TheOneApp/src/data/book/scraped-navigation.json`.

2. **Copies content files**: The script copies all JSON files from `src/data/book/content/` to `TheOneApp/src/data/book/content/`.

3. **Removes obsolete files**: The script removes the old `navigation.json` file if it exists to avoid confusion.

## Title Formatting

The navigation data from the source website includes some formatting that needs to be cleaned up:

1. **Volume titles**: Volume titles often include an "Expand" suffix (e.g., "Volume 1Expand") which is removed.

2. **Book and chapter titles**: Some titles include suffixes like "| Print Book" or "| eBook" which are removed.

The cleaning is done in both the `bookService.ts` and `BookNavigationTree.tsx` components using the `cleanTitle()` function.

## URL Handling

The URLs in the navigation data are in the format:
```
https://www.newmessage.org/the-message/volume-1/god-spoken-again/the-proclamation/
```

The last part of the URL is extracted to use as the chapter ID using the `extractIdFromUrl()` function.

## Troubleshooting

### Common Issues

1. **Missing navigation data**: If the navigation tree is empty, run the sync script to populate the data.

2. **Content not found**: If chapter content is not available, check if the content file exists in the `content` directory.

3. **Incorrect titles**: If titles display incorrectly (e.g., with "Expand" suffix), check the `cleanTitle()` function in both `bookService.ts` and `BookNavigationTree.tsx`.

### Debugging

Both the `bookService.ts` and `BookNavigationTree.tsx` components include debug logging to help troubleshoot issues:

- Navigation data structure is logged when loaded
- Title cleaning is logged when titles are modified
- File operations are logged during synchronization

## Future Improvements

1. **Standardize Navigation Format**: Consider standardizing the navigation format to remove the "Expand" suffix and use relative URLs.

2. **Automated Synchronization**: Implement automated synchronization during the build process.

3. **Content Caching**: Improve the content caching mechanism to reduce load times.

4. **Offline Support**: Enhance offline support by downloading and storing content files locally.
