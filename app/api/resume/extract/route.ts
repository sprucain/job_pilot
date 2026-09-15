import { NextRequest, NextResponse } from "next/server";

import { MAX_RESUME_SIZE_BYTES } from "@/lib/constants";
import { extractProfileFromResume } from "@/lib/resume-extraction";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, error: "No resume file provided." }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ success: false, error: "Resume must be a PDF file." }, { status: 400 });
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "Resume must be under 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await extractProfileFromResume(buffer);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 422 });
    }
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error("[resume/extract]", error);
    return NextResponse.json(
      { success: false, error: "Extraction failed. Please try again or fill in the form manually." },
      { status: 500 },
    );
  }
}
