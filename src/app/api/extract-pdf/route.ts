import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const name = file.name.toLowerCase();
    let text = "";

    if (name.endsWith(".pdf")) {
      // Validate PDF magic bytes: must start with %PDF
      if (buffer.length < 4 || buffer.toString("ascii", 0, 4) !== "%PDF") {
        return NextResponse.json({ error: "Invalid file format. The file does not appear to be a valid PDF." }, { status: 400 });
      }
      const result = await pdfParse(buffer);
      text = result.text;
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      // Validate DOCX/ZIP magic bytes: must start with PK (0x50 0x4B)
      if (buffer.length < 2 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        return NextResponse.json({ error: "Invalid file format. The file does not appear to be a valid DOCX document." }, { status: 400 });
      }
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      text = buffer.toString("utf-8");
    }

    text = text.replace(/\s+/g, " ").trim();

    if (text.length < 20) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file. Please paste the SOP text manually." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("File extraction error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
