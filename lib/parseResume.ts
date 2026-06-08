import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { normalizeText } from "@/lib/text";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function parseResumeFile(file: File) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Resume file is too large. Please upload a PDF or DOCX under 5 MB.");
  }

  const fileName = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return normalizeText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  if (
    fileName.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value);
  }

  throw new Error("Unsupported file type. Please upload a PDF or DOCX resume.");
}
