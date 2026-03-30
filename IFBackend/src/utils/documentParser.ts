import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function parseDocument(buffer: Buffer, filename: string): Promise<string> {
  const extension = filename.split(".").pop()?.toLowerCase();

  try {
    if (extension === "pdf") {
      const data = await pdfParse(buffer);
      console.log(`✅ Passed PDF Parser (Pages: ${data.numpages})`);
      return data.text;
    } else if (extension === "docx") {
      const data = await mammoth.extractRawText({ buffer });
      console.log(`✅ Passed DOCX Parser`);
      return data.value;
    } else {
      throw new Error("Unsupported file format. Only .pdf and .docx are supported.");
    }
  } catch (err: any) {
    console.error("Error analyzing document format:", err.message);
    throw new Error(`Document Parsing Failed: ${err.message}`);
  }
}
