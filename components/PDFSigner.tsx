"use client";

import React, { useRef, useEffect, useState } from "react";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import DraggableSignatureBox from "./DraggableSignatureBox";

type FieldType = "signature" | "name" | "date" | "initials";

interface SignatureField {
  x: number; // relative [0,1]
  y: number; // relative [0,1]
  page: number;
  id: string;
  type: FieldType;
}

interface PDFSignerProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  fields?: SignatureField[];
  setFields?: React.Dispatch<React.SetStateAction<SignatureField[]>>;
  readOnly?: boolean;
  showSampleData?: boolean;
}

const SIGNATURE_BOX_SIZE = 64; // px

const PDFSigner: React.FC<PDFSignerProps> = ({ pdf, fields, setFields, readOnly = false, showSampleData = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = typeof fields !== 'undefined' && typeof setFields !== 'undefined';
  const [internalFields, internalSetFields] = useState<SignatureField[]>([]);
  const fieldsToUse: SignatureField[] = isControlled ? fields! : internalFields;
  const setFieldsToUse: React.Dispatch<React.SetStateAction<SignatureField[]>> = isControlled ? setFields! : internalSetFields;
  const [selectedFieldType, setSelectedFieldType] = useState<FieldType>("signature");
  const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [thumbnails, setThumbnails] = useState<string[]>([]); // data URLs for thumbnails
  const numPages = pdf.numPages;
  const wasDraggingRef = useRef(false);

  // Generate thumbnails for all pages
  useEffect(() => {
    let cancelled = false;
    const generateThumbnails = async () => {
      const thumbs: string[] = [];
      for (let i = 1; i <= numPages; i++) {
        const pageObj = await pdf.getPage(i);
        const vp = pageObj.getViewport({ scale: 0.25 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        await pageObj.render({ canvasContext: ctx!, viewport: vp }).promise;
        if (!cancelled) thumbs.push(canvas.toDataURL());
      }
      if (!cancelled) setThumbnails(thumbs);
    };
    generateThumbnails();
    return () => { cancelled = true; };
  }, [pdf, numPages]);

  // Set viewport for active page
  useEffect(() => {
    let isMounted = true;
    const getViewport = async () => {
      const pageObj = await pdf.getPage(activePage);
      const vp = pageObj.getViewport({ scale: 1.5 });
      if (isMounted) setViewport({ width: vp.width, height: vp.height });
    };
    getViewport();
    return () => { isMounted = false; };
  }, [pdf, activePage]);

  // Render active PDF page to canvas
  const renderTaskRef = useRef<any>(null);
  useEffect(() => {
    if (!viewport) return;
    if (renderTaskRef.current && renderTaskRef.current.cancel) {
      renderTaskRef.current.cancel();
    }
    let cancelled = false;
    const render = async () => {
      const pageObj = await pdf.getPage(activePage);
      const vp = pageObj.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = vp.width;
      canvas.height = vp.height;
      const ctx = canvas.getContext("2d");
      const renderTask = pageObj.render({ canvasContext: ctx!, viewport: vp });
      renderTaskRef.current = renderTask;
      try {
        await renderTask.promise;
      } catch (err) {
        if (!cancelled) console.error('PDF render error:', err);
      }
    };
    render();
    return () => {
      cancelled = true;
      if (renderTaskRef.current && renderTaskRef.current.cancel) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdf, activePage, viewport]);

  // Place signature field on click (for active page)
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return;
    if (wasDraggingRef.current) {
      wasDraggingRef.current = false;
      return; // Prevent accidental field creation after drag
    }
    if (!containerRef.current || !viewport) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / viewport.width;
    const y = (e.clientY - rect.top) / viewport.height;
    setFieldsToUse(fields => [
      ...fields,
      { x, y, page: activePage, id: `${Date.now()}-${Math.random()}`, type: selectedFieldType }
    ]);
  };

  // Remove signature field
  const removeField = (id: string) => {
    if (readOnly) return;
    setFieldsToUse(fields => fields.filter(f => f.id !== id));
  };

  // Debug: log numPages and thumbnails
  console.log('PDFSigner debug:', { numPages, thumbnailsLength: thumbnails.length });

  return (
    <div className="flex w-full justify-center gap-6" style={{ minHeight: 400 }}>
      {/* Sidebar with thumbnails (debug: thick red border, always visible, all steps, all modes, even for 1 page) */}
      <div
        className="w-24 flex flex-col items-center bg-gray-50 py-4"
        style={{
          border: '0.5px solid #e5e7eb',
          minWidth: 96,
          maxHeight: (viewport?.height || 600) + 32, // match PDF preview area, +padding
          overflowY: numPages > 10 ? 'auto' : 'visible',
        }}
      >

        {Array.from({ length: numPages }, (_, idx) => (
          <button
            key={idx}
            className={`mb-3 border-2 overflow-hidden focus:outline-none h-20 w-14 ${activePage === idx + 1 ? 'border-blue-600' : 'border-transparent'}`}
            style={{ boxShadow: activePage === idx + 1 ? '0 0 0 2px #2563eb' : undefined, background: activePage === idx + 1 ? '#eff6ff' : undefined, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setActivePage(idx + 1)}
          >
            {thumbnails[idx] ? (
              <img src={thumbnails[idx]} alt={`Page ${idx + 1}`} className="w-14 h-20 object-contain" />
            ) : (
              <div className="w-14 h-20 flex items-center justify-center bg-gray-200 text-gray-400 text-lg font-bold">{idx + 1}</div>
            )}
            <div className="text-xs text-gray-500">{idx + 1}</div>
          </button>
        ))}
      </div>
      {/* Main page area + field selectors on right */}
      <div className="flex flex-row flex-1 items-center justify-center gap-8" style={{ minHeight: 400, marginBottom: 120 }}>
        {/* PDF Canvas */}
        <div className="relative mx-auto" style={{ width: viewport?.width || 0, height: viewport?.height || 0 }}>
          <div
            ref={containerRef}
            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
            onClick={handleClick}
            style={{ zIndex: 1 }}
          >
            {/* Signature boxes for active page only */}
            {fieldsToUse.filter(f => f.page === activePage).map(f => (
              readOnly && showSampleData ? (
                <div
                  key={f.id}
                  style={{
                    position: 'absolute',
                    left: `${f.x * (viewport?.width || 1)}px`,
                    top: `${f.y * (viewport?.height || 1)}px`,
                    width: `${SIGNATURE_BOX_SIZE}px`,
                    height: `${SIGNATURE_BOX_SIZE}px`,
                    background: '#f8fafc',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#334155',
                    fontWeight: 600,
                    fontSize: 16,
                    fontFamily: f.type === 'signature' ? 'cursive' : undefined,
                    fontStyle: f.type === 'signature' ? 'italic' : undefined,
                    zIndex: 10,
                  }}
                >
                  {f.type === 'signature' && <span>John Doe</span>}
                  {f.type === 'name' && <span>John Doe</span>}
                  {f.type === 'initials' && <span>J.D</span>}
                  {f.type === 'date' && <span>{new Date().toLocaleDateString('en-GB')}</span>}
                </div>
              ) : (
                <DraggableSignatureBox
                  key={f.id}
                  field={f}
                  viewport={viewport}
                  onMove={readOnly ? (() => {}) : ((newX: number, newY: number) => {
                    setFieldsToUse(fields => fields.map(field =>
                      field.id === f.id ? { ...field, x: newX, y: newY } : field
                    ));
                  })}
                  onRemove={readOnly ? (() => {}) : (() => removeField(f.id))}
                  onDragEnd={readOnly ? (() => {}) : (() => { wasDraggingRef.current = true; })}
                />
              )
            ))}
          </div>
          <canvas ref={canvasRef} className="block" style={{ zIndex: 0 }} />
          {fieldsToUse.length > 0 && (
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white   hover:bg-blue-700 absolute bottom-4 right-4 z-10"
              onClick={() => alert(JSON.stringify(fieldsToUse, null, 2))}
            >
              Generate Signing Link
            </button>
          )}
        </div>
        {/* Field type selector (right side, vertical; only in step 1) */}
        {!readOnly && (
          <div className="flex flex-col gap-4 items-center ml-8">
            {[
              { type: "signature", label: "Signature", color: "bg-blue-600 text-white border-blue-600" },
              { type: "name", label: "Full Name", color: "bg-green-600 text-white border-green-600" },
              { type: "date", label: "Signing Date", color: "bg-purple-600 text-white border-purple-600" },
              { type: "initials", label: "Initials", color: "bg-pink-600 text-white border-pink-600" }
            ].map(opt => (
              <button
                key={opt.type}
                className={`px-6 py-3 -lg border-2 font-bold  transition focus:outline-none text-lg ${selectedFieldType === opt.type ? opt.color : "border-gray-300 bg-white text-gray-700"}`}
                onClick={() => setSelectedFieldType(opt.type as FieldType)}
                style={{ minWidth: 120 }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFSigner;
