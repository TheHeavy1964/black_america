// ==========================================
// SECURE ADMIN ACTIONS ROUTE — Next.js API
// ==========================================

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const passcode = req.headers.get("x-admin-passcode") || searchParams.get("passcode");
    const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

    if (passcode !== adminPasscode) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Invalid passcode." }, { status: 401 });
    }

    const supabase = createAdminClient();
    
    // Fetch both pending_review and active organizations so admin can moderate
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, organizations: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "An error occurred." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const passcode = req.headers.get("x-admin-passcode");
    const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";

    if (passcode !== adminPasscode) {
      return NextResponse.json({ success: false, message: "Unauthorized access. Invalid passcode." }, { status: 401 });
    }

    const body = await req.json();
    const { action, id, organization } = body;
    const supabase = createAdminClient();

    if (!action || !id) {
      return NextResponse.json({ success: false, message: "Missing action or ID." }, { status: 400 });
    }

    if (action === "approve") {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "active" })
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Entry approved and published successfully." });
    }

    if (action === "reject") {
      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Entry rejected and deleted." });
    }

    if (action === "update") {
      if (!organization) {
        return NextResponse.json({ success: false, message: "Missing organization update body." }, { status: 400 });
      }

      // Ensure we clean undefined or null properties to avoid Supabase errors
      const updatedData = { ...organization };
      delete updatedData.created_at;
      delete updatedData.updated_at;

      const { error } = await supabase
        .from("organizations")
        .update(updatedData)
        .eq("id", id);

      if (error) throw error;
      return NextResponse.json({ success: true, message: "Entry updated successfully." });
    }

    return NextResponse.json({ success: false, message: "Invalid action type." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "An error occurred." }, { status: 500 });
  }
}
