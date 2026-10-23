import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type ReceiptItemPayload = {
  name?: string;
  quantity?: string | number;
  unitPrice?: string | number;
  totalPrice?: string | number;
  expiryDate?: string;
};

type ReceiptSavePayload = {
  userId?: string;
  storeName?: string;
  receiptDate?: string;
  items?: ReceiptItemPayload[];
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanDate(value: unknown) {
  const valueAsString = cleanString(value);

  return /^\d{4}-\d{2}-\d{2}$/.test(valueAsString) ? valueAsString : "";
}

function cleanMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const cleaned = cleanString(value).replace(/[₹,$\s]/g, "");

  if (!cleaned) {
    return null;
  }

  const number = Number(cleaned);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function cleanQuantity(value: unknown) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 ? number : 1;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in to save receipt items.",
        },
        {
          status: 401,
        },
      );
    }

    const payload = (await request.json()) as ReceiptSavePayload;

    const items = Array.isArray(payload.items) ? payload.items : [];

    if (items.length === 0) {
      return NextResponse.json(
        {
          error: "Add at least one receipt item before saving.",
        },
        {
          status: 400,
        },
      );
    }

    const {
      data: membership,
      error: membershipError,
    } = await supabase
      .from("family_members")
      .select("family_id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        {
          error: "You are not connected to a family inventory.",
        },
        {
          status: 403,
        },
      );
    }

    if (membership.role !== "owner" && membership.role !== "editor") {
      return NextResponse.json(
        {
          error:
            "Only an Owner or Editor can save receipt items to inventory.",
        },
        {
          status: 403,
        },
      );
    }

    const receiptDate = cleanDate(payload.receiptDate);
    const storeName = cleanString(payload.storeName);

    const rows = items
      .map((item) => {
        const name = cleanString(item.name);

        if (!name) {
          return null;
        }

        const expiryDate = cleanDate(item.expiryDate);
        const price =
          cleanMoney(item.totalPrice) ?? cleanMoney(item.unitPrice);

        return {
          family_id: membership.family_id,
          name: name.slice(0, 200),
          brand: null,
          category: "other",
          storage_location: "other",
          quantity: cleanQuantity(item.quantity),
          unit: "piece",
          minimum_quantity: 0,
          purchase_date: receiptDate || new Date().toISOString().split("T")[0],
          expiry_date: expiryDate || null,
          price,
          notes: storeName ? `Added from receipt: ${storeName}` : null,
          created_by: user.id,
          updated_by: user.id,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error: "No valid receipt items were found.",
        },
        {
          status: 400,
        },
      );
    }

    const { error } = await supabase.from("inventory_items").insert(rows);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    return NextResponse.json({
      savedCount: rows.length,
    });
  } catch (error) {
    console.error("Save receipt items failed:", error);

    return NextResponse.json(
      {
        error: "Unable to save receipt items. Please try again.",
      },
      {
        status: 500,
      },
    );
  }
}