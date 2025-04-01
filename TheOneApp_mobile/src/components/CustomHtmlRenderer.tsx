/**
 * Custom HTML Renderer Component
 * 
 * A lightweight HTML renderer for React Native that converts simple HTML
 * to native components without the complexity of a full HTML renderer.
 * Supports basic tags and styling.
 */

import React, { useMemo } from 'react';
import { Text, View, TouchableOpacity, Linking, StyleSheet } from 'react-native';

interface CustomHtmlRendererProps {
  html: string;
  textSize: number;
  onLinkPress?: (url: string) => void;
}

export const CustomHtmlRenderer: React.FC<CustomHtmlRendererProps> = ({ 
  html, 
  textSize,
  onLinkPress 
}) => {
  // Parse HTML and convert to React Native components
  const renderedContent = useMemo(() => {
    if (!html) return null;
    
    // Clean up HTML - remove extra whitespace, normalize line breaks
    const cleanHtml = html
      .replace(/\n\s*\n/g, '\n\n')  // Normalize multiple line breaks
      .replace(/[ \t]+/g, ' ')      // Normalize horizontal whitespace only, preserve newlines
      .trim();
    
    // Split content into paragraphs
    const paragraphs = cleanHtml.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Skip empty paragraphs
      if (!paragraph.trim()) return null;
      
      // Check if paragraph is a heading
      if (paragraph.startsWith('<h1>') || paragraph.startsWith('<h2>') || 
          paragraph.startsWith('<h3>') || paragraph.startsWith('<h4>')) {
        const headingLevel = parseInt(paragraph.charAt(2));
        const headingText = paragraph
          .replace(/<h[1-4]>/g, '')
          .replace(/<\/h[1-4]>/g, '')
          .trim();
        
        return renderHeading(headingText, headingLevel, textSize, index);
      }
      
      // Check if paragraph is a blockquote
      if (paragraph.startsWith('<blockquote>')) {
        const quoteText = paragraph
          .replace(/<blockquote>/g, '')
          .replace(/<\/blockquote>/g, '')
          .trim();
        
        return renderBlockquote(quoteText, textSize, index);
      }
      
      // Check if paragraph is a list
      if (paragraph.startsWith('<ul>') || paragraph.startsWith('<ol>')) {
        const isOrdered = paragraph.startsWith('<ol>');
        const listContent = paragraph
          .replace(/<ul>|<ol>/g, '')
          .replace(/<\/ul>|<\/ol>/g, '')
          .trim();
        
        const items = listContent.split('<li>').filter(item => item.trim());
        const cleanItems = items.map(item => item.replace(/<\/li>/g, '').trim());
        
        return renderList(cleanItems, isOrdered, textSize, index);
      }
      
      // Regular paragraph - check for links and formatting
      return renderParagraph(paragraph, textSize, index, onLinkPress);
    }).filter(Boolean); // Remove null items
  }, [html, textSize, onLinkPress]);
  
  return (
    <View>
      {renderedContent}
    </View>
  );
};

// Helper function to render headings with line breaks
const renderHeading = (text: string, level: number, baseSize: number, key: number) => {
  const fontSize = baseSize * (2.2 - (level * 0.3)); // h1: 1.9x, h2: 1.6x, h3: 1.3x, h4: 1.0x
  
  // Split by newlines and preserve them for rendering
  const lines = text.split('\n');
  
  return (
    <Text 
      key={`heading-${key}`} 
      style={{
        fontSize,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 16,
        marginBottom: 8,
        lineHeight: fontSize * 1.3,
      }}
    >
      {lines.map((line, lineIndex) => (
        <Text key={`heading-line-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && '\n'}
        </Text>
      ))}
    </Text>
  );
};

// Helper function to render blockquotes with line breaks
const renderBlockquote = (text: string, baseSize: number, key: number) => {
  // Split by newlines and preserve them for rendering
  const lines = text.split('\n');
  
  return (
    <View 
      key={`quote-${key}`}
      style={{
        borderLeftWidth: 2,
        borderLeftColor: '#1DB954',
        paddingLeft: 16,
        marginVertical: 12,
      }}
    >
      <Text 
        style={{
          fontSize: baseSize,
          color: '#FFFFFF',
          fontStyle: 'italic',
          lineHeight: baseSize * 1.5,
        }}
      >
        {lines.map((line, lineIndex) => (
          <Text key={`quote-line-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 && '\n'}
          </Text>
        ))}
      </Text>
    </View>
  );
};

// Helper function to render lists with line breaks in items
const renderList = (items: string[], ordered: boolean, baseSize: number, key: number) => {
  return (
    <View key={`list-${key}`} style={{ marginVertical: 12 }}>
      {items.map((item, i) => {
        // Split item by newlines
        const lines = item.split('\n');
        
        return (
          <View key={`item-${key}-${i}`} style={{ flexDirection: 'row', marginBottom: 8 }}>
            {/* Bullet or number */}
            <Text style={{ fontSize: baseSize, color: '#FFFFFF', marginRight: 8, width: 16, lineHeight: baseSize * 1.5 }}>
              {ordered ? `${i + 1}.` : '•'}
            </Text>
            
            {/* Item text with line breaks */}
            <Text 
              style={{
                flex: 1,
                fontSize: baseSize,
                color: '#FFFFFF',
                lineHeight: baseSize * 1.5,
              }}
            >
              {lines.map((line, lineIndex) => (
                <Text key={`item-line-${lineIndex}`}>
                  {line}
                  {lineIndex < lines.length - 1 && '\n'}
                </Text>
              ))}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

// Helper function to render paragraphs with inline formatting and links
const renderParagraph = (text: string, baseSize: number, key: number, onLinkPress?: (url: string) => void) => {
  // Process links
  const processLinks = (content: string) => {
    const linkRegex = /<a\s+href="([^"]+)"[^>]*>(.*?)<\/a>/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }
      
      // Add the link
      parts.push({
        type: 'link',
        url: match[1],
        content: match[2]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }
    
    return parts;
  };
  
  // Process bold and italic
  const processFormatting = (content: string) => {
    // Replace <strong> or <b> with bold
    content = content.replace(/<(strong|b)>(.*?)<\/(strong|b)>/g, '*$2*');
    
    // Replace <em> or <i> with italic
    content = content.replace(/<(em|i)>(.*?)<\/(em|i)>/g, '_$2_');
    
    return content;
  };
  
  // Clean paragraph text (remove <p> tags)
  const cleanText = text
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    .trim();
  
  // Process links and formatting
  const parts = processLinks(cleanText);
  
  // Handle paragraphs with newlines
  const renderWithLineBreaks = (content: string, isLink = false, url = '') => {
    // Split by newlines but preserve them for rendering
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      // For links
      if (isLink) {
        return (
          <Text
            key={`link-line-${lineIndex}`}
            style={{ color: '#1DB954', textDecorationLine: 'underline' }}
            onPress={() => {
              if (onLinkPress && url) {
                onLinkPress(url);
              } else if (url) {
                Linking.openURL(url);
              }
            }}
          >
            {line}
            {lineIndex < lines.length - 1 && '\n'}
          </Text>
        );
      }
      
      // For regular text
      const formattedText = processFormatting(line);
      return (
        <Text key={`text-line-${lineIndex}`}>
          {formattedText}
          {lineIndex < lines.length - 1 && '\n'}
        </Text>
      );
    });
  };
  
  // If no links, render simple text with line breaks
  if (parts.length === 1 && parts[0].type === 'text') {
    const content = parts[0].content;
    
    return (
      <Text 
        key={`para-${key}`}
        style={{
          fontSize: baseSize,
          color: '#FFFFFF',
          lineHeight: baseSize * 1.5,
          marginBottom: 16,
        }}
      >
        {renderWithLineBreaks(content)}
      </Text>
    );
  }
  
  // Render paragraph with links and line breaks
  return (
    <Text 
      key={`para-${key}`}
      style={{
        fontSize: baseSize,
        color: '#FFFFFF',
        lineHeight: baseSize * 1.5,
        marginBottom: 16,
      }}
    >
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return renderWithLineBreaks(part.content);
        } else if (part.type === 'link') {
          return renderWithLineBreaks(part.content, true, part.url);
        }
        return null;
      })}
    </Text>
  );
};

export default CustomHtmlRenderer;
