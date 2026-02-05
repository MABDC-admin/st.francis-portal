import PptxGenJS from 'pptxgenjs';
import { jsPDF } from 'jspdf';

export interface Slide {
  number: number;
  title: string;
  content: string[];
  designNotes?: string[];
  speakerNotes?: string;
}

export interface StyleTheme {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
}

export const STYLE_THEMES: Record<string, StyleTheme> = {
  modern: {
    name: 'Modern Minimal',
    primaryColor: '2563EB',
    backgroundColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: '3B82F6',
    fontFamily: 'Arial',
  },
  corporate: {
    name: 'Corporate Professional',
    primaryColor: '1E3A5F',
    backgroundColor: 'F3F4F6',
    textColor: '111827',
    accentColor: '0369A1',
    fontFamily: 'Arial',
  },
  creative: {
    name: 'Creative Colorful',
    primaryColor: '8B5CF6',
    backgroundColor: 'FEFCE8',
    textColor: '1F2937',
    accentColor: 'F59E0B',
    fontFamily: 'Arial',
  },
  academic: {
    name: 'Academic',
    primaryColor: '1F2937',
    backgroundColor: 'FFFBEB',
    textColor: '374151',
    accentColor: '6B7280',
    fontFamily: 'Georgia',
  },
  dark: {
    name: 'Dark Mode',
    primaryColor: '60A5FA',
    backgroundColor: '0F172A',
    textColor: 'F8FAFC',
    accentColor: '38BDF8',
    fontFamily: 'Arial',
  },
};

/**
 * Parse markdown content into slide objects
 */
export function parseSlides(markdown: string): Slide[] {
  const slides: Slide[] = [];
  const slideRegex = /## Slide (\d+):\s*(.+?)(?=\n|$)/g;
  const parts = markdown.split(/(?=## Slide \d+:)/);

  for (const part of parts) {
    const match = slideRegex.exec(part);
    slideRegex.lastIndex = 0;
    
    if (match) {
      const slideNumber = parseInt(match[1], 10);
      const title = match[2].trim();
      
      // Extract content section
      const contentMatch = part.match(/### Content\s*([\s\S]*?)(?=###|$)/);
      const content: string[] = [];
      if (contentMatch) {
        const lines = contentMatch[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
            content.push(trimmed.replace(/^[-*•]\s*/, ''));
          } else if (trimmed && !trimmed.startsWith('#')) {
            content.push(trimmed);
          }
        }
      }

      // Extract design notes
      const designMatch = part.match(/### Design Notes\s*([\s\S]*?)(?=###|$)/);
      const designNotes: string[] = [];
      if (designMatch) {
        const lines = designMatch[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
            designNotes.push(trimmed.replace(/^[-*]\s*/, ''));
          }
        }
      }

      // Extract speaker notes
      const speakerMatch = part.match(/### Speaker Notes\s*([\s\S]*?)(?=---|## Slide|$)/);
      const speakerNotes = speakerMatch ? speakerMatch[1].trim() : undefined;

      slides.push({
        number: slideNumber,
        title,
        content: content.filter(c => c.length > 0),
        designNotes: designNotes.length > 0 ? designNotes : undefined,
        speakerNotes,
      });
    }
  }

  // Sort by slide number
  slides.sort((a, b) => a.number - b.number);
  return slides;
}

/**
 * Export presentation to PowerPoint format
 */
export async function exportToPptx(
  slides: Slide[],
  title: string,
  style: string = 'modern'
): Promise<void> {
  const theme = STYLE_THEMES[style] || STYLE_THEMES.modern;
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = 'AI Presentation Generator';
  pptx.title = title;
  pptx.subject = title;
  
  // Define master slide
  pptx.defineSlideMaster({
    title: 'MAIN',
    background: { color: theme.backgroundColor },
  });

  for (const slide of slides) {
    const pptSlide = pptx.addSlide({ masterName: 'MAIN' });

    // Check if it's a title slide (slide 1)
    if (slide.number === 1) {
      // Title slide layout
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 2.5,
        w: 9,
        h: 1.5,
        fontSize: 44,
        bold: true,
        color: theme.primaryColor,
        align: 'center',
        fontFace: theme.fontFamily,
      });

      // Add subtitle if there's content
      if (slide.content.length > 0) {
        pptSlide.addText(slide.content[0], {
          x: 0.5,
          y: 4,
          w: 9,
          h: 0.75,
          fontSize: 24,
          color: theme.textColor,
          align: 'center',
          fontFace: theme.fontFamily,
        });
      }
    } else {
      // Content slide layout
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.3,
        w: 9,
        h: 0.75,
        fontSize: 32,
        bold: true,
        color: theme.primaryColor,
        fontFace: theme.fontFamily,
      });

      // Add accent line
      pptSlide.addShape('rect', {
        x: 0.5,
        y: 1.1,
        w: 2,
        h: 0.05,
        fill: { color: theme.accentColor },
      });

      // Add bullet points
      if (slide.content.length > 0) {
        const bulletPoints = slide.content.map(text => ({
          text,
          options: { bullet: true, indentLevel: 0 },
        }));

        pptSlide.addText(bulletPoints, {
          x: 0.5,
          y: 1.5,
          w: 9,
          h: 4,
          fontSize: 18,
          color: theme.textColor,
          fontFace: theme.fontFamily,
          lineSpacing: 28,
          valign: 'top',
        });
      }

      // Add slide number
      pptSlide.addText(slide.number.toString(), {
        x: 9,
        y: 5.2,
        w: 0.5,
        h: 0.3,
        fontSize: 12,
        color: theme.accentColor,
        align: 'right',
        fontFace: theme.fontFamily,
      });
    }

    // Add speaker notes if available
    if (slide.speakerNotes) {
      pptSlide.addNotes(slide.speakerNotes);
    }
  }

  // Generate and download the file
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_presentation.pptx`;
  await pptx.writeFile({ fileName: filename });
}

/**
 * Export presentation to PDF format
 */
export function exportToPdf(
  slides: Slide[],
  title: string,
  style: string = 'modern'
): void {
  const theme = STYLE_THEMES[style] || STYLE_THEMES.modern;
  
  // Create landscape PDF
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;

  // Convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  };

  const primaryRgb = hexToRgb(theme.primaryColor);
  const textRgb = hexToRgb(theme.textColor);
  const bgRgb = hexToRgb(theme.backgroundColor);
  const accentRgb = hexToRgb(theme.accentColor);

  slides.forEach((slide, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    // Background
    pdf.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    if (slide.number === 1) {
      // Title slide
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(36);
      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      
      const titleLines = pdf.splitTextToSize(slide.title, pageWidth - margin * 2);
      const titleY = pageHeight / 2 - 20;
      pdf.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

      // Subtitle
      if (slide.content.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(18);
        pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        const subtitleLines = pdf.splitTextToSize(slide.content[0], pageWidth - margin * 2);
        pdf.text(subtitleLines, pageWidth / 2, titleY + 25, { align: 'center' });
      }
    } else {
      // Content slide
      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.text(slide.title, margin, margin + 10);

      // Accent line
      pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.rect(margin, margin + 15, 40, 1.5, 'F');

      // Content
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(14);
      pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);

      let yPosition = margin + 30;
      const lineHeight = 10;
      const maxWidth = pageWidth - margin * 2 - 10;

      for (const content of slide.content) {
        const bulletText = `• ${content}`;
        const lines = pdf.splitTextToSize(bulletText, maxWidth);
        
        for (const line of lines) {
          if (yPosition > pageHeight - margin - 20) break;
          pdf.text(line, margin + 5, yPosition);
          yPosition += lineHeight;
        }
        yPosition += 2; // Extra space between bullets
      }

      // Slide number
      pdf.setFontSize(10);
      pdf.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.text(slide.number.toString(), pageWidth - margin, pageHeight - margin, { align: 'right' });
    }
  });

  // Download the PDF
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_presentation.pdf`;
  pdf.save(filename);
}
