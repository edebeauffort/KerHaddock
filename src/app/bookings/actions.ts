"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendApprovalGrantedEmail, sendPendingApprovalEmail } from "@/lib/email";

export type BookingActionState = {
  error?: string;
  success?: boolean;
  pending?: boolean;
};

// Looks up which branch(es) (other than the requester's own) have a
// priority period overlapping the requested dates. Empty array = no
// approval needed, book straight to "confirmed".
async function findOverlappingBranches(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startDate: string,
  endDate: string,
  ownBranch: string | null,
) {
  const query = supabase
    .from("priority_periods")
    .select("family_branch")
    .filter("date_range", "ov", `[${startDate},${endDate})`);

  const { data } = ownBranch
    ? await query.neq("family_branch", ownBranch)
    : await query;

  return Array.from(new Set((data ?? []).map((p) => p.family_branch)));
}

// Emails everyone in the given branch(es) that a request landed on their
// priority period. Best-effort: a failed send should never break booking.
async function notifyPendingApproval(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    requesterId: string;
    roomIds: string[];
    startDate: string;
    endDate: string;
    pendingBranches: string[];
  },
) {
  const { requesterId, roomIds, startDate, endDate, pendingBranches } = params;

  const [{ data: requesterProfile }, { data: roomsData }, { data: branchMembers }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", requesterId)
        .single(),
      supabase.from("rooms").select("id, name, house_id").in("id", roomIds),
      supabase
        .from("profiles")
        .select("email")
        .in("family_branch", pendingBranches),
    ]);

  const requesterName =
    requesterProfile && (requesterProfile.first_name || requesterProfile.last_name)
      ? `${requesterProfile.first_name ?? ""} ${requesterProfile.last_name ?? ""}`.trim()
      : "Un membre de la famille";

  // A single stay can span rooms in both houses at once (the booking form
  // allows multiselect across houses), so collect every distinct house name
  // involved instead of assuming there's only one.
  const houseIds = Array.from(
    new Set((roomsData ?? []).map((r) => r.house_id)),
  );
  const { data: housesData } = houseIds.length
    ? await supabase.from("houses").select("name").in("id", houseIds)
    : { data: null };

  const to = (branchMembers ?? [])
    .map((m) => m.email)
    .filter((email): email is string => Boolean(email));

  await sendPendingApprovalEmail({
    to,
    requesterName,
    houseName: (housesData ?? []).map((h) => h.name).join(" + ") || "la maison",
    roomNames: roomsData?.map((r) => r.name) ?? [],
    startDate,
    endDate,
    familyBranch: pendingBranches.join(", "),
  });
}

export async function createBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const roomIds = formData.getAll("roomIds").filter(Boolean) as string[];
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const guestCount = Number(formData.get("guestCount") ?? 1);
  const notes = (formData.get("notes") as string) || null;

  if (roomIds.length === 0 || !startDate || !endDate) {
    return {
      error: "Sélectionnez vos dates et au moins une chambre (ou la maison entière).",
    };
  }

  if (startDate >= endDate) {
    return { error: "La date de départ doit être après la date d'arrivée." };
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("family_branch")
    .eq("id", user.id)
    .single();

  const pendingBranches = await findOverlappingBranches(
    supabase,
    startDate,
    endDate,
    myProfile?.family_branch ?? null,
  );
  const isPending = pendingBranches.length > 0;

  // Postgres daterange: '[start,end)' — end date is the checkout day, not a night stayed.
  const rows = roomIds.map((roomId) => ({
    room_id: roomId,
    user_id: user.id,
    date_range: `[${startDate},${endDate})`,
    guest_count: guestCount,
    notes,
    status: isPending ? "pending" : "confirmed",
    pending_branches: isPending ? pendingBranches : null,
  }));

  // Inserted as one statement, so booking several bedrooms at once (e.g. the
  // whole house) is all-or-nothing: if any one bedroom is unavailable, none
  // of them get booked. Pending bookings sit outside the overlap-prevention
  // constraint (it only applies to status='confirmed') until approved.
  const { error } = await supabase.from("bookings").insert(rows);

  if (error) {
    // 23P01 = exclusion_violation, raised by the overlap-prevention constraint in schema.sql
    if (error.code === "23P01") {
      return {
        error:
          "Une ou plusieurs de ces chambres sont déjà réservées à ces dates.",
      };
    }
    return { error: error.message };
  }

  if (isPending) {
    await notifyPendingApproval(supabase, {
      requesterId: user.id,
      roomIds,
      startDate,
      endDate,
      pendingBranches,
    });
  }

  revalidatePath("/bookings");
  return { success: true, pending: isPending };
}

export async function updateBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const oldBookingIds = formData
    .getAll("oldBookingIds")
    .filter(Boolean) as string[];
  const roomIds = formData.getAll("roomIds").filter(Boolean) as string[];
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const guestCount = Number(formData.get("guestCount") ?? 1);
  const notes = (formData.get("notes") as string) || null;

  if (oldBookingIds.length === 0 || roomIds.length === 0 || !startDate || !endDate) {
    return {
      error: "Sélectionnez vos dates et au moins une chambre (ou la maison entière).",
    };
  }

  if (startDate >= endDate) {
    return { error: "La date de départ doit être après la date d'arrivée." };
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("family_branch")
    .eq("id", user.id)
    .single();

  const pendingBranches = await findOverlappingBranches(
    supabase,
    startDate,
    endDate,
    myProfile?.family_branch ?? null,
  );
  const isPending = pendingBranches.length > 0;

  // replace_booking() deletes the old rows and inserts the new ones inside
  // one database transaction, so a conflict rolls the whole edit back
  // instead of leaving you with neither the old nor the new booking.
  const { error } = await supabase.rpc("replace_booking", {
    old_booking_ids: oldBookingIds,
    new_room_ids: roomIds,
    new_start: startDate,
    new_end: endDate,
    new_guest_count: guestCount,
    new_notes: notes,
    new_status: isPending ? "pending" : "confirmed",
    new_pending_branches: isPending ? pendingBranches : null,
  });

  if (error) {
    if (error.code === "23P01") {
      return {
        error:
          "Une ou plusieurs de ces chambres sont déjà réservées à ces dates.",
      };
    }
    return { error: error.message };
  }

  if (isPending) {
    await notifyPendingApproval(supabase, {
      requesterId: user.id,
      roomIds,
      startDate,
      endDate,
      pendingBranches,
    });
  }

  revalidatePath("/bookings");
  return { success: true, pending: isPending };
}

export async function cancelBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const bookingIds = formData.getAll("bookingIds").filter(Boolean) as string[];

  if (bookingIds.length === 0) {
    return { error: "Rien à annuler." };
  }

  // .eq("user_id", user.id) is belt-and-braces — the "Members can update
  // their own bookings" RLS policy already blocks cancelling anyone else's.
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .in("id", bookingIds)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bookings");
  return { success: true };
}

// Approves a pending stay. RLS ("Members can approve pending bookings")
// enforces that only someone whose family_branch is in the booking's
// pending_branches can actually make this update succeed.
export async function approveBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Vous devez être connecté." };
  }

  const bookingIds = formData.getAll("bookingIds").filter(Boolean) as string[];

  if (bookingIds.length === 0) {
    return { error: "Rien à approuver." };
  }

  const { data: bookingsToApprove } = await supabase
    .from("bookings")
    .select("id, room_id, user_id, date_range")
    .in("id", bookingIds);

  if (!bookingsToApprove || bookingsToApprove.length === 0) {
    return { error: "Réservation introuvable." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .in("id", bookingIds);

  if (error) {
    // 42501/no rows updated via RLS reads back as a generic error or zero
    // rows affected — either way, the requester wasn't allowed to approve.
    return {
      error: error.message || "Vous ne pouvez pas approuver cette demande.",
    };
  }

  const first = bookingsToApprove[0];
  const match = first.date_range.match(/\[(.+),(.+)\)/);
  const startDate = match?.[1] ?? "";
  const endDate = match?.[2] ?? "";

  const [{ data: requester }, { data: roomsData }] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", first.user_id).single(),
    supabase
      .from("rooms")
      .select("id, name, house_id")
      .in("id", bookingsToApprove.map((b) => b.room_id)),
  ]);

  const houseId = roomsData?.[0]?.house_id;
  const { data: houseData } = houseId
    ? await supabase.from("houses").select("name").eq("id", houseId).single()
    : { data: null };

  if (requester?.email) {
    await sendApprovalGrantedEmail({
      to: requester.email,
      houseName: houseData?.name ?? "la maison",
      roomNames: roomsData?.map((r) => r.name) ?? [],
      startDate,
      endDate,
    });
  }

  revalidatePath("/bookings");
  return { success: true };
}
