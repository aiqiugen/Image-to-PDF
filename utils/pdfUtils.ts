import { jsPDF } from "jspdf";
import { UploadedImage, PdfSettings, PageSize, PageOrientation, ImageFit } from "../types";

export const generatePdf = async (images: UploadedImage[], settings: PdfSettings): Promise<void> => {
  if (images.length === 0) return;

  // Initialize PDF
  // If FIT_IMAGE, we initialize with the first image's size, but we'll change it per page anyway.
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: false // Try to keep lossless quality
  });

  // Remove the default first page if we are going to customize pages loop
  // However, jsPDF always starts with one page. We will edit it or add new ones.
  
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    
    // Logic to determine page dimensions
    let pageWidth: number;
    let pageHeight: number;

    // A4 dimensions in mm
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    const LETTER_WIDTH = 215.9;
    const LETTER_HEIGHT = 279.4;

    let targetFormat: string | number[] = 'a4';

    if (settings.pageSize === PageSize.FIT_IMAGE) {
      // Convert pixels to mm (approx 96 DPI usually, but let's assume 72 DPI for PDF standard or just pixel mapping)
      // jsPDF: 1px = 1pt = 1/72 inch = 0.352778 mm
      const pxToMm = 0.264583; // 1px @ 96dpi
      pageWidth = img.width * pxToMm;
      pageHeight = img.height * pxToMm;
      targetFormat = [pageWidth, pageHeight];
    } else if (settings.pageSize === PageSize.LETTER) {
      pageWidth = LETTER_WIDTH;
      pageHeight = LETTER_HEIGHT;
      targetFormat = 'letter';
    } else {
      pageWidth = A4_WIDTH;
      pageHeight = A4_HEIGHT;
      targetFormat = 'a4';
    }

    // Determine Orientation
    let orientation: "p" | "l" = "p";
    if (settings.orientation === PageOrientation.AUTO) {
      orientation = img.width > img.height ? "l" : "p";
      // Swap page dimensions if landscape and using standard formats
      if (settings.pageSize !== PageSize.FIT_IMAGE && orientation === 'l') {
        const temp = pageWidth;
        pageWidth = pageHeight;
        pageHeight = temp;
      }
    } else {
      orientation = settings.orientation === PageOrientation.LANDSCAPE ? "l" : "p";
       if (settings.pageSize !== PageSize.FIT_IMAGE && orientation === 'l') {
         // Force landscape dimensions
         if(pageWidth < pageHeight) {
            const temp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = temp;
         }
       }
    }

    // Add page (skip for first iteration if we want to reuse the default page, but clean slate is easier)
    if (i > 0) {
      doc.addPage(targetFormat, orientation);
    } else {
      // For the first page, we might need to resize the default one
      // jsPDF doesn't easily resize the first page after init in all versions, 
      // but let's try setting internal pageSize.
      // Safer: delete page 1 later? No, jsPDF API is additive.
      // Best: Init doc with correct settings for page 1.
      // We'll just set the page size for the current page if supported, or just add a page and delete the first empty one if needed.
      // Actually, doc.addPage() updates the cursor. 
      // Let's rely on setPage(1) and context.
      
      // Workaround: Re-initialize specific page size for page 1?
      // Actually, passing format to addPage is best.
      // We will init doc, then if settings require different size, we deal with it.
      
      if (settings.pageSize === PageSize.FIT_IMAGE) {
          // Resetting page 1 size is tricky in vanilla jsPDF public API without internal hacking.
          // Easier approach: Delete page 1 at the end if we added new ones? 
          // Alternative: Just render to the default A4 page 1 if user selected A4, else clean start.
          
          // Let's just accept standard behavior: modify the current page width/height internally if needed
          // or just proceed. For FIT_IMAGE, creating a PDF with correct size is key.
          
          const pxToMm = 0.264583;
          const w = img.width * pxToMm;
          const h = img.height * pxToMm;
          
          // This effectively resizes the *current* page in recent jsPDF versions
          doc.deletePage(1);
          doc.addPage([w, h], w > h ? 'l' : 'p');
      } else {
         // If orientation doesn't match default 'p', rotate page 1
         if (orientation !== 'p') {
             doc.deletePage(1);
             doc.addPage(targetFormat, orientation);
         }
      }
    }

    // Drawing the image
    const margin = settings.margin;
    const drawWidth = pageWidth - (margin * 2);
    const drawHeight = pageHeight - (margin * 2);
    
    let x = margin;
    let y = margin;
    let w = drawWidth;
    let h = drawHeight;

    if (settings.pageSize === PageSize.FIT_IMAGE) {
       // Fill the whole page
       w = pageWidth;
       h = pageHeight;
       x = 0;
       y = 0;
    } else if (settings.imageFit === ImageFit.CONTAIN) {
       // Scale to fit maintaining aspect ratio
       const imgRatio = img.width / img.height;
       const pageRatio = drawWidth / drawHeight;

       if (imgRatio > pageRatio) {
         // Image is wider than print area
         h = drawWidth / imgRatio;
         y = margin + (drawHeight - h) / 2; // Center vertically
       } else {
         // Image is taller than print area
         w = drawHeight * imgRatio;
         x = margin + (drawWidth - w) / 2; // Center horizontally
       }
    }
    // ImageFit.FILL uses initialized w/h which stretches
    
    doc.addImage(img.previewUrl, img.type === 'image/png' ? 'PNG' : 'JPEG', x, y, w, h, undefined, 'NONE');
  }

  doc.save(settings.filename || 'images.pdf');
};
