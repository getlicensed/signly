"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';
import FieldWizard from './FieldWizard';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';



export type PDFUploadProps = {
  onFileLoaded?: (file: File, pdf: pdfjsLib.PDFDocumentProxy) => void;
  showLogoTagline?: boolean;
};

const PDFUpload: React.FC<PDFUploadProps> = ({ onFileLoaded, showLogoTagline }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const pdfFile = acceptedFiles[0];
    if (!pdfFile || pdfFile.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }
    setFile(pdfFile);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
        const loadedPdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        setPdf(loadedPdf);
        setUploaded(true);
        if (onFileLoaded) onFileLoaded(pdfFile, loadedPdf);
      } catch (err) {
        // Log the error for debugging
        console.error("PDF.js failed to load PDF:", err);
        setError("Failed to load PDF. Please try another file. See browser console for details.");
      }
    };
    reader.readAsArrayBuffer(pdfFile);
  }, [onFileLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div className="w-full max-w-lg mx-auto">
      {!uploaded && showLogoTagline && (
        <div className="w-full max-w-xl p-8 bg-white rounded-xl shadow-lg flex flex-col items-center mb-8">
          <div className="flex items-center mb-6">
            <svg className="w-10 h-10 text-blue-600 mr-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6M7 16h8" />
            </svg>
            <span className="text-3xl font-bold text-blue-700 tracking-tight">Signly</span>
          </div>
          <p className="text-gray-600 mb-8 text-center">
            Upload your PDF, place signature fields, and send for signing.<br />
            <span className="text-blue-600 font-medium">No account required.</span>
          </p>
        </div>
      )}
      {!uploaded && (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition bg-gray-50 hover:bg-blue-50 ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
          >
            <input {...getInputProps()} />
            <p className="text-lg font-semibold text-gray-700 mb-2">Drag & drop a PDF here, or click to select</p>
            <p className="text-gray-400 text-sm">Only PDF files are supported.</p>
          </div>
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </>
      )}
      {uploaded && pdf && (
        <FieldWizard pdf={pdf} />
      )}
    </div>
  );
};

export default PDFUpload;
