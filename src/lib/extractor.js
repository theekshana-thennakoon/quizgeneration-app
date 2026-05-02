// Use the locally bundled worker via Vite's ?url import (works with pdfjs-dist v5)
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth';

// Point pdfjs to local worker bundle — no CDN dependency
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const extractPdfText = async (arrayBuffer) => {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

const extractDocxText = async (arrayBuffer) => {
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

export const extractTextFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const fileType = file.type || '';
        const fileName = file.name?.toLowerCase() || '';

        if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
          resolve(new TextDecoder().decode(arrayBuffer));
        } else if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
          const text = await extractPdfText(arrayBuffer);
          resolve(text);
        } else if (
          fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          fileName.endsWith('.docx')
        ) {
          const text = await extractDocxText(arrayBuffer);
          resolve(text);
        } else {
          reject(new Error(`Unsupported file type: "${fileType}" for file "${file.name}"`));
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (e) => reject(new Error(`FileReader error: ${e.target.error?.message || 'unknown'}`));
    reader.readAsArrayBuffer(file);
  });
};
