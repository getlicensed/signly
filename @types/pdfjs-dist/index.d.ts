// Minimal type declarations for pdfjs-dist/legacy/build/pdf

declare module 'pdfjs-dist/legacy/build/pdf' {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };

  export interface PDFDocumentProxy {
    numPages: number;
    getPage(pageNumber: number): Promise<PDFPageProxy>;
    // Add more as needed
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): PDFPageViewport;
    render(params: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport }): { promise: Promise<void> };
    // Add more as needed
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
    // Add more as needed
  }

  export function getDocument(src: any): {
    promise: Promise<PDFDocumentProxy>;
  };
}
