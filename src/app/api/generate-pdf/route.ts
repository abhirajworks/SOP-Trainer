import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Title
      doc.fontSize(22).font("Helvetica-Bold").text("SOP Training Manual", { align: "center" });
      doc.moveDown(0.5);
      
      if (data.analysis) {
        doc.fontSize(10).font("Helvetica").fillColor("gray")
           .text(`${data.analysis.sop_type.toUpperCase()} | ${data.analysis.audience.toUpperCase()} | ${data.analysis.complexity.toUpperCase()}`, { align: "center" });
      }
      doc.fillColor("black").moveDown(3);

      // Overview
      doc.fontSize(16).font("Helvetica-Bold").text("Overview");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica").text(data.overview || "", { lineGap: 3 });
      doc.moveDown(2.5);

      // Modules
      doc.fontSize(16).font("Helvetica-Bold").text("Training Modules");
      doc.moveDown(1);
      data.training_modules?.forEach((mod: any, i: number) => {
        doc.fontSize(14).font("Helvetica-Bold").text(`Module ${i + 1}: ${mod.learning_objective}`);
        doc.moveDown(0.8);
        
        doc.fontSize(11).font("Helvetica-Bold").text("What to Do:");
        doc.font("Helvetica").text(mod.what_to_do || "", { lineGap: 2 });
        doc.moveDown(0.5);
        
        doc.font("Helvetica-Bold").text("Why It Matters:");
        doc.font("Helvetica").text(mod.why_it_matters || "", { lineGap: 2 });
        doc.moveDown(0.5);
        
        doc.font("Helvetica-Bold").text("Example:");
        doc.font("Helvetica").text(mod.example || "", { lineGap: 2 });
        doc.moveDown(0.5);
        
        doc.font("Helvetica-Bold").text("Common Mistake:");
        doc.font("Helvetica").fillColor("red").text(mod.common_mistake || "", { lineGap: 2 }).fillColor("black");
        
        if (mod.prerequisite) {
          doc.moveDown(0.5);
          doc.font("Helvetica-Bold").text("Prerequisite:");
          doc.font("Helvetica").text(mod.prerequisite, { lineGap: 2 });
        }
        doc.moveDown(2);
      });

      doc.addPage();

      // Scenarios
      doc.fontSize(16).font("Helvetica-Bold").text("Decision Scenarios");
      doc.moveDown(1);
      data.decision_scenarios?.forEach((ds: any, i: number) => {
        doc.fontSize(13).font("Helvetica-Bold").text(`Scenario ${i + 1}: ${ds.situation || ""}`);
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica-Bold").text("Decision:");
        doc.font("Helvetica").text(ds.decision || "", { lineGap: 2 });
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").text("Reasoning:");
        doc.font("Helvetica").text(ds.reasoning || "", { lineGap: 2 });
        doc.moveDown(2);
      });

      doc.addPage();

      // Quiz
      doc.fontSize(16).font("Helvetica-Bold").text("Interactive Quiz");
      doc.moveDown(1);
      data.quiz?.forEach((q: any, i: number) => {
        doc.fontSize(12).font("Helvetica-Bold").text(`Q${i + 1}: ${q.question || ""}`);
        doc.moveDown(0.5);
        doc.fontSize(11);
        q.options?.forEach((opt: string, oi: number) => {
           const prefix = String.fromCharCode(65 + oi);
           doc.font("Helvetica").text(`  ${prefix}. ${opt}`, { lineGap: 2 });
        });
        doc.moveDown(0.8);
        doc.font("Helvetica-Bold").text("Answer: ").font("Helvetica").text(q.answer || "");
        doc.moveDown(0.5);
        doc.font("Helvetica-Bold").text("Explanation: ").font("Helvetica").text(q.explanation || "", { lineGap: 2 });
        doc.moveDown(2);
      });

      doc.end();
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="sop-training-manual.pdf"`,
      },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
