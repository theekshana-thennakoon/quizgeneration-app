// Use a legacy-compatible version of PDF.js for maximum hosting compatibility
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

/**
 * We use the v3.11.174 worker.
 * Standard .js workers (non-module) are much more reliable on shared hosting
 * like InfinityFree because they don't trigger "Failed to fetch module" errors.
 */
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const extractPdfText = async (arrayBuffer) => {
  try {
    const loadingTask = pdfjsLib.getDocument({ 
      data: new Uint8Array(arrayBuffer),
      useWorkerFetch: true, // Improved compatibility
      isEvalSupported: false // Safer for some environments
    });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error(`Failed to read PDF: ${error.message}`);
  }
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
