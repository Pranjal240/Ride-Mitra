import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  LogIn,
  Lock,
  Minus,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { format } from "date-fns";

import { useAuthStore } from "@/hooks/useStore";
import { getRideById, createBooking, getReviewsForUser, deleteRide } from "@/lib/api";
import { MapView, type MapMarker } from "@/components/maps";
import { calculateRoute } from "@/lib/maps";
import { dashboardPath } from "@/lib/roles";
import type { Ride, Review } from "@/types";
import { Badge, Button, Container, PageShell, Panel } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface RazorpayResponse {
  razorpay_payment_id: string;
}

export default function BookRide() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [ride, setRide] = useState<Ride | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(1);
  const [booking, setBooking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const r = await getRideById(id);
        setRide(r);
        if (r?.driver_id) setReviews((await getReviewsForUser(r.driver_id)).slice(0, 3));
        if (r?.from_location && r?.to_location) {
          try {
            const route = await calculateRoute(r.from_location, r.to_location);
            if (route.geometry) setRouteCoords(route.geometry);
          } catch {
            /* markers still show */
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const markers = useMemo<MapMarker[]>(() => {
    if (!ride) return [];
    const m: MapMarker[] = [];
    if (ride.from_location) m.push({ id: "from", position: [ride.from_location.lat, ride.from_location.lng], type: "pickup", popup: `Pickup: ${ride.from_location.address || "Start"}` });
    if (ride.to_location) m.push({ id: "to", position: [ride.to_location.lat, ride.to_location.lng], type: "drop", popup: `Drop: ${ride.to_location.address || "End"}` });
    return m;
  }, [ride]);

  const handleBook = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!ride) return;
    setBooking(true);
    try {
      const total = seats * (ride.price_per_seat || 0);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: "INR",
        name: "Ride Mitra",
        description: `Booking ride from ${ride.from_location?.address} to ${ride.to_location?.address}`,
        handler: async function (response: RazorpayResponse) {
          try {
            await createBooking({
              ride_id: ride.id,
              rider_id: user.id,
              seats_booked: seats,
              total_price: total,
              payment_status: "paid",
              payment_id: response.razorpay_payment_id,
            });
            navigate("/bookings");
          } catch (e) {
            console.error("Booking failed after payment", e);
            alert("Payment succeeded but booking failed. Contact support.");
          }
        },
        prefill: { name: user.full_name || "", email: user.email || "", contact: user.phone || "" },
        theme: { color: "#1B2B4B" },
      };
      const w = window as unknown as { Razorpay?: new (o: typeof options) => { open: () => void; on: (e: string, cb: (r: { error: { description: string } }) => void) => void } };
      if (!w.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        await new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }
      const rzp = new w.Razorpay!(options);
      rzp.on("payment.failed", (response) => {
        alert(response.error.description);
        setBooking(false);
      });
      rzp.open();
    } catch (e) {
      console.error("Booking initiation failed", e);
      alert("Could not initiate payment. Please try again.");
      setBooking(false);
    }
  };

  const handleDeleteRide = async () => {
    if (!ride) return;
    if (!window.confirm("Delete this ride? All bookings will be cancelled.")) return;
    setDeleting(true);
    try {
      await deleteRide(ride.id);
      navigate(-1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
      setDeleting(false);
    }
  };

  if (loading)
    return (
      <PageShell>
        <Container size="5xl" className="space-y-4">
          <div className="h-72 animate-pulse rounded-2xl border border-border bg-muted" />
          <div className="h-32 animate-pulse rounded-2xl border border-border bg-muted" />
        </Container>
      </PageShell>
    );

  if (!ride)
    return (
      <PageShell className="grid place-items-center">
        <div className="text-center">
          <Car className="mx-auto size-12 text-muted-foreground" />
          <h2 className="mt-3 font-display text-xl font-bold text-foreground">Ride not found</h2>
          <Button className="mt-4" onClick={() => navigate("/rides/search")}>
            Find rides
          </Button>
        </div>
      </PageShell>
    );

  const totalPrice = seats * (ride.price_per_seat || 0);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "New";
  const isOwner = user?.id === ride.driver_id;

  return (
    <PageShell>
      <Container size="5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </button>

        <Panel inset="none" className="mb-5 overflow-hidden">
          <MapView
            markers={markers}
            route={routeCoords.length > 0 ? routeCoords : undefined}
            center={ride.from_location ? [ride.from_location.lat, ride.from_location.lng] : undefined}
            zoom={12}
            height="320px"
          />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* left */}
          <div className="space-y-4">
            <Panel className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy-light font-display text-xl font-bold text-white">
                {ride.driver?.profile_photo ? (
                  <img src={ride.driver.profile_photo} alt="" className="size-full object-cover" />
                ) : (
                  (ride.driver?.full_name || "D")[0]
                )}
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">{ride.driver?.full_name || "Driver"}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm">
                  <Star className="size-4 fill-warning text-warning" />
                  <span className="font-semibold text-foreground">{avgRating}</span>
                  <span className="text-muted-foreground">({reviews.length} reviews)</span>
                </p>
              </div>
            </Panel>

            <Panel>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 pt-1">
                  <span className="size-3 rounded-full bg-success" />
                  <span className="h-5 w-0.5 bg-gradient-to-b from-success to-danger" />
                  <span className="size-3 rounded-full bg-danger" />
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">From</p>
                    <p className="text-sm font-medium text-foreground">{ride.from_location?.address || "Start"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">To</p>
                    <p className="text-sm font-medium text-foreground">{ride.to_location?.address || "End"}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
                <Badge tone="info" icon={<Calendar className="size-3.5" />}>
                  {format(new Date(ride.departure_time), "EEE, MMM d")}
                </Badge>
                <Badge tone="accent" icon={<Clock className="size-3.5" />}>
                  {format(new Date(ride.departure_time), "h:mm a")}
                </Badge>
                <Badge tone="success" icon={<Users className="size-3.5" />}>
                  {ride.seats_available} seats
                </Badge>
              </div>
            </Panel>

            {reviews.length > 0 && (
              <Panel>
                <h3 className="mb-3 font-display font-bold text-foreground">Driver reviews</h3>
                <div className="space-y-2.5">
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-muted/40 p-3.5">
                      <div className="mb-1 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("size-3", i < r.rating ? "fill-accent text-accent" : "text-border")} />
                        ))}
                        <span className="ml-1.5 text-xs text-muted-foreground">{r.reviewer?.full_name}</span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </div>

          {/* right — sticky booking */}
          <div className="lg:sticky lg:top-20">
            {isOwner ? (
              <Panel className="border-accent/30 bg-accent-soft/30">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-accent text-navy">
                    <Car className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display font-bold text-foreground">Your ride</h3>
                    <p className="text-xs text-muted-foreground">Manage from your dashboard</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => navigate(dashboardPath(user?.user_type))}>
                    Dashboard
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={handleDeleteRide} loading={deleting}>
                    Delete
                  </Button>
                </div>
              </Panel>
            ) : (
              <Panel>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Book your <span className="text-accent">seat</span>
                </h3>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Number of seats</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSeats(Math.max(1, seats - 1))}
                      aria-label="Decrease seats"
                      className="grid size-10 place-items-center rounded-xl border border-border text-foreground hover:bg-muted"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-8 text-center font-mono text-2xl font-bold text-foreground">{seats}</span>
                    <button
                      type="button"
                      onClick={() => setSeats(Math.min(ride.seats_available || 4, seats + 1))}
                      aria-label="Increase seats"
                      className="grid size-10 place-items-center rounded-xl bg-accent text-navy"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>

                <dl className="mt-5 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <dt>Price per seat</dt>
                    <dd className="font-mono">₹{ride.price_per_seat}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Seats × {seats}</dt>
                    <dd className="font-mono">₹{totalPrice}</dd>
                  </div>
                </dl>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-accent/30 bg-accent-soft/40 px-4 py-3.5">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-mono text-2xl font-bold text-foreground">₹{totalPrice}</span>
                </div>

                <p className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-xs text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                  Your request will be sent to the driver for confirmation.
                </p>

                {user ? (
                  <Button className="mt-4 w-full" onClick={handleBook} loading={booking} icon={!booking ? <CheckCircle2 className="size-4" /> : undefined}>
                    Request booking
                  </Button>
                ) : (
                  <>
                    <Button className="mt-4 w-full" onClick={() => navigate("/login")} icon={<LogIn className="size-4" />}>
                      Sign in to book
                    </Button>
                    <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3" /> Login required to finalize booking
                    </p>
                  </>
                )}
              </Panel>
            )}
          </div>
        </div>
      </Container>
    </PageShell>
  );
}
