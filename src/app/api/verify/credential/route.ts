import { NextRequest, NextResponse } from "next/server";
import { verifyCredentialRecord } from "@/lib/credentials/credential-verification-engine";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || searchParams.get("credentialId") || searchParams.get("seal");

    if (!id) {
      return NextResponse.json(
        { error: "Missing credential identifier. Query parameter 'id' or 'credentialId' required." },
        { status: 400 }
      );
    }

    const verificationResult = await verifyCredentialRecord(id);

    if (!verificationResult) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          message: "Credential could not be verified. The document reference or digital seal does not match institutional registry records.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: "Academic credential verified against institutional cryptographic ledger.",
      credential: verificationResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error verifying academic credential", details: String(error) },
      { status: 500 }
    );
  }
}
