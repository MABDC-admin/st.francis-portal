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
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  gradientStart: string;
  gradientEnd: string;
  fontFamily: string;
  decorativeShapes: boolean;
}

export const STYLE_THEMES: Record<string, StyleTheme> = {
  modern: {
    name: 'Modern Minimal',
    primaryColor: '4F46E5', // Indigo
    secondaryColor: '818CF8',
    backgroundColor: 'FFFFFF',
    textColor: '1F2937',
    accentColor: '06B6D4', // Cyan
    gradientStart: '4F46E5',
    gradientEnd: '06B6D4',
    fontFamily: 'Arial',
    decorativeShapes: true,
  },
  corporate: {
    name: 'Corporate Professional',
    primaryColor: '1E40AF', // Blue
    secondaryColor: '3B82F6',
    backgroundColor: 'F8FAFC',
    textColor: '0F172A',
    accentColor: 'F59E0B', // Amber
    gradientStart: '1E40AF',
    gradientEnd: '3B82F6',
    fontFamily: 'Arial',
    decorativeShapes: true,
  },
  creative: {
    name: 'Creative Colorful',
    primaryColor: 'EC4899', // Pink
    secondaryColor: 'F472B6',
    backgroundColor: 'FFFBEB',
    textColor: '1F2937',
    accentColor: '8B5CF6', // Purple
    gradientStart: 'EC4899',
    gradientEnd: 'F59E0B',
    fontFamily: 'Arial',
    decorativeShapes: true,
  },
  academic: {
    name: 'Academic',
    primaryColor: '1E3A5F',
    secondaryColor: '3D5A80',
    backgroundColor: 'FFFBF5',
    textColor: '374151',
    accentColor: '059669', // Emerald
    gradientStart: '1E3A5F',
    gradientEnd: '059669',
    fontFamily: 'Georgia',
    decorativeShapes: false,
  },
  dark: {
    name: 'Dark Mode',
    primaryColor: '8B5CF6', // Purple
    secondaryColor: 'A78BFA',
    backgroundColor: '0F172A',
    textColor: 'F8FAFC',
    accentColor: '22D3EE', // Cyan
    gradientStart: '8B5CF6',
    gradientEnd: '22D3EE',
    fontFamily: 'Arial',
    decorativeShapes: true,
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
 * Add decorative shapes to a slide
 */
function addDecorativeShapes(
  pptSlide: PptxGenJS.Slide,
  theme: StyleTheme,
  slideNumber: number,
  isTitle: boolean
) {
  if (!theme.decorativeShapes) return;

  if (isTitle) {
    // Large gradient circle top-right
    pptSlide.addShape('ellipse', {
      x: 7,
      y: -1.5,
      w: 4,
      h: 4,
      fill: { color: theme.gradientStart, transparency: 70 },
    });
    
    // Medium circle bottom-left
    pptSlide.addShape('ellipse', {
      x: -0.5,
      y: 4,
      w: 2.5,
      h: 2.5,
      fill: { color: theme.accentColor, transparency: 80 },
    });

    // Small accent circle
    pptSlide.addShape('ellipse', {
      x: 8.5,
      y: 4.5,
      w: 1,
      h: 1,
      fill: { color: theme.secondaryColor, transparency: 60 },
    });

    // Decorative line
    pptSlide.addShape('rect', {
      x: 0.5,
      y: 3.5,
      w: 2.5,
      h: 0.08,
      fill: { color: theme.accentColor },
    });
  } else {
    // Alternate decorations based on slide number
    const pattern = slideNumber % 3;
    
    if (pattern === 0) {
      // Top-right corner decoration
      pptSlide.addShape('ellipse', {
        x: 8.5,
        y: -0.5,
        w: 2,
        h: 2,
        fill: { color: theme.gradientStart, transparency: 85 },
      });
    } else if (pattern === 1) {
      // Bottom-left corner accent
      pptSlide.addShape('rect', {
        x: -0.3,
        y: 4.5,
        w: 0.8,
        h: 1.5,
        fill: { color: theme.accentColor, transparency: 75 },
      });
    } else {
      // Side stripe
      pptSlide.addShape('rect', {
        x: 9.7,
        y: 0,
        w: 0.3,
        h: 5.63,
        fill: { color: theme.gradientEnd, transparency: 70 },
      });
    }

    // Subtle header accent bar
    pptSlide.addShape('rect', {
      x: 0,
      y: 0,
      w: 10,
      h: 0.12,
      fill: { color: theme.primaryColor },
    });
  }
}

/**
 * Add visual bullet icons
 */
function getBulletIcon(index: number, theme: StyleTheme): PptxGenJS.TextPropsOptions {
  const icons = ['●', '◆', '▸', '★', '◉'];
  return {
    bullet: { type: 'number', style: 'arabicPeriod' } as any,
    color: theme.accentColor,
  };
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
  pptx.layout = 'LAYOUT_16x9';
  
  // Define master slide with background
  pptx.defineSlideMaster({
    title: 'MAIN',
    background: { color: theme.backgroundColor },
  });

  for (const slide of slides) {
    const pptSlide = pptx.addSlide({ masterName: 'MAIN' });

    // Check if it's a title slide (slide 1)
    if (slide.number === 1) {
      // Add decorative elements first (behind content)
      addDecorativeShapes(pptSlide, theme, slide.number, true);

      // Gradient accent bar at top
      pptSlide.addShape('rect', {
        x: 0,
        y: 0,
        w: 10,
        h: 0.15,
        fill: { color: theme.primaryColor },
      });

      // Main title with shadow effect simulation
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 2.2,
        w: 9,
        h: 1.2,
        fontSize: 48,
        bold: true,
        color: theme.primaryColor,
        align: 'left',
        fontFace: theme.fontFamily,
      });

      // Accent underline for title
      pptSlide.addShape('rect', {
        x: 0.5,
        y: 3.4,
        w: 3,
        h: 0.1,
        fill: { color: theme.accentColor },
      });

      // Add subtitle if there's content
      if (slide.content.length > 0) {
        pptSlide.addText(slide.content[0], {
          x: 0.5,
          y: 3.7,
          w: 8,
          h: 0.6,
          fontSize: 22,
          color: theme.textColor,
          align: 'left',
          fontFace: theme.fontFamily,
        });
      }

      // Decorative icon/shape for visual interest
      pptSlide.addShape('ellipse', {
        x: 7.5,
        y: 2.8,
        w: 1.8,
        h: 1.8,
        fill: { color: theme.accentColor, transparency: 20 },
        line: { color: theme.accentColor, width: 2 },
      });

    } else {
      // Add decorative elements
      addDecorativeShapes(pptSlide, theme, slide.number, false);

      // Slide title with accent
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.4,
        w: 8.5,
        h: 0.7,
        fontSize: 32,
        bold: true,
        color: theme.primaryColor,
        fontFace: theme.fontFamily,
      });

      // Accent line under title
      pptSlide.addShape('rect', {
        x: 0.5,
        y: 1.15,
        w: 2,
        h: 0.06,
        fill: { color: theme.accentColor },
      });

      // Add bullet points with visual styling
      if (slide.content.length > 0) {
        const bulletPoints = slide.content.map((text, idx) => ({
          text: `  ${text}`,
          options: {
            bullet: { 
              type: 'bullet' as const,
              characterCode: '25CF', // Filled circle
              color: theme.accentColor,
            },
            indentLevel: 0,
            paraSpaceBefore: idx === 0 ? 0 : 8,
          },
        }));

        pptSlide.addText(bulletPoints, {
          x: 0.5,
          y: 1.5,
          w: 8.5,
          h: 3.8,
          fontSize: 20,
          color: theme.textColor,
          fontFace: theme.fontFamily,
          lineSpacing: 32,
          valign: 'top',
        });

        // Add visual accent box for key content
        if (slide.content.length >= 3) {
          pptSlide.addShape('roundRect', {
            x: 0.3,
            y: 1.35,
            w: 0.08,
            h: Math.min(slide.content.length * 0.6, 3.5),
            fill: { color: theme.accentColor },
          });
        }
      }

      // Slide number with style
      pptSlide.addShape('ellipse', {
        x: 9,
        y: 5,
        w: 0.45,
        h: 0.45,
        fill: { color: theme.primaryColor, transparency: 30 },
      });
      
      pptSlide.addText(slide.number.toString(), {
        x: 9,
        y: 5.05,
        w: 0.45,
        h: 0.35,
        fontSize: 11,
        color: theme.primaryColor,
        align: 'center',
        fontFace: theme.fontFamily,
        bold: true,
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
 * Export presentation to PDF format with visual design
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
  const secondaryRgb = hexToRgb(theme.secondaryColor);
  const textRgb = hexToRgb(theme.textColor);
  const bgRgb = hexToRgb(theme.backgroundColor);
  const accentRgb = hexToRgb(theme.accentColor);
  const gradientStartRgb = hexToRgb(theme.gradientStart);
  const gradientEndRgb = hexToRgb(theme.gradientEnd);

  slides.forEach((slide, index) => {
    if (index > 0) {
      pdf.addPage();
    }

    // Background
    pdf.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative shapes
    if (theme.decorativeShapes) {
      // Top gradient bar
      pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.rect(0, 0, pageWidth, 4, 'F');

      if (slide.number === 1) {
        // Large decorative circle for title slide (semi-transparent simulation with lighter color)
        const lightGradient = {
          r: Math.min(255, gradientStartRgb.r + 180),
          g: Math.min(255, gradientStartRgb.g + 180),
          b: Math.min(255, gradientStartRgb.b + 180),
        };
        pdf.setFillColor(lightGradient.r, lightGradient.g, lightGradient.b);
        pdf.circle(pageWidth - 40, 30, 50, 'F');
        
        const lightAccent = {
          r: Math.min(255, accentRgb.r + 160),
          g: Math.min(255, accentRgb.g + 160),
          b: Math.min(255, accentRgb.b + 160),
        };
        pdf.setFillColor(lightAccent.r, lightAccent.g, lightAccent.b);
        pdf.circle(30, pageHeight - 30, 35, 'F');
      } else {
        // Smaller accents for content slides
        const pattern = slide.number % 3;
        
        if (pattern === 0) {
          const light = {
            r: Math.min(255, gradientStartRgb.r + 200),
            g: Math.min(255, gradientStartRgb.g + 200),
            b: Math.min(255, gradientStartRgb.b + 200),
          };
          pdf.setFillColor(light.r, light.g, light.b);
          pdf.circle(pageWidth - 20, 20, 25, 'F');
        } else if (pattern === 1) {
          const light = {
            r: Math.min(255, accentRgb.r + 180),
            g: Math.min(255, accentRgb.g + 180),
            b: Math.min(255, accentRgb.b + 180),
          };
          pdf.setFillColor(light.r, light.g, light.b);
          pdf.rect(0, pageHeight - 40, 8, 40, 'F');
        } else {
          const light = {
            r: Math.min(255, secondaryRgb.r + 180),
            g: Math.min(255, secondaryRgb.g + 180),
            b: Math.min(255, secondaryRgb.b + 180),
          };
          pdf.setFillColor(light.r, light.g, light.b);
          pdf.rect(pageWidth - 5, 0, 5, pageHeight, 'F');
        }
      }
    }

    if (slide.number === 1) {
      // Title slide
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(42);
      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      
      const titleLines = pdf.splitTextToSize(slide.title, pageWidth - margin * 2);
      const titleY = pageHeight / 2 - 15;
      pdf.text(titleLines, margin, titleY);

      // Accent underline
      pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.rect(margin, titleY + 8, 60, 2, 'F');

      // Subtitle
      if (slide.content.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(20);
        pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        const subtitleLines = pdf.splitTextToSize(slide.content[0], pageWidth - margin * 2);
        pdf.text(subtitleLines, margin, titleY + 22);
      }

      // Decorative circle
      pdf.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.setLineWidth(1.5);
      pdf.circle(pageWidth - 60, pageHeight / 2, 25, 'S');
      
    } else {
      // Content slide
      // Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(26);
      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.text(slide.title, margin, margin + 12);

      // Accent line under title
      pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
      pdf.rect(margin, margin + 17, 40, 1.5, 'F');

      // Content with styled bullets
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(15);
      pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);

      let yPosition = margin + 32;
      const lineHeight = 11;
      const maxWidth = pageWidth - margin * 2 - 15;

      // Vertical accent bar for bullets
      if (slide.content.length > 0) {
        const lightBar = {
          r: Math.min(255, accentRgb.r + 50),
          g: Math.min(255, accentRgb.g + 50),
          b: Math.min(255, accentRgb.b + 50),
        };
        pdf.setFillColor(lightBar.r, lightBar.g, lightBar.b);
        pdf.rect(margin - 3, yPosition - 3, 2, Math.min(slide.content.length * lineHeight + 5, pageHeight - yPosition - margin - 20), 'F');
      }

      for (const content of slide.content) {
        // Bullet point
        pdf.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b);
        pdf.circle(margin + 4, yPosition - 1.5, 1.5, 'F');
        
        // Text
        pdf.setTextColor(textRgb.r, textRgb.g, textRgb.b);
        const lines = pdf.splitTextToSize(content, maxWidth);
        
        for (const line of lines) {
          if (yPosition > pageHeight - margin - 20) break;
          pdf.text(line, margin + 10, yPosition);
          yPosition += lineHeight;
        }
        yPosition += 3; // Extra space between bullets
      }

      // Slide number with circle background
      const lightPrimary = {
        r: Math.min(255, primaryRgb.r + 180),
        g: Math.min(255, primaryRgb.g + 180),
        b: Math.min(255, primaryRgb.b + 180),
      };
      pdf.setFillColor(lightPrimary.r, lightPrimary.g, lightPrimary.b);
      pdf.circle(pageWidth - margin, pageHeight - margin, 8, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.text(slide.number.toString(), pageWidth - margin - 2.5, pageHeight - margin + 3);
    }
  });

  // Download the PDF
  const filename = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_presentation.pdf`;
  pdf.save(filename);
}
