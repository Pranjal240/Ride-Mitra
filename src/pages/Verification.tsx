import { useState, useEffect } from "react";
import { CheckCircle2, FileText, Car, Bike, Bus, ShieldCheck, Upload } from "lucide-react";

import { useAuthStore } from "@/hooks/useStore";
import { submitVerification, getVerification } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { DriverVerification } from "@/types";
import { Field } from "@/components/ui/smooth-input";
import { Badge, Button, Container, PageShell, Panel, Spinner, type BadgeTone } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/scroll-reveal";
import { cn } from "@/lib/utils";

const VEHICLES = [
  { key: "car", label: "Car", icon: <Car className="size-6" /> },
  { key: "bike", label: "Bike", icon: <Bike className="size-6" /> },
  { key: "auto", label: "Auto", icon: <Bus className="size-6" /> },
];

const STATUS: Record<string, { tone: BadgeTone; label: string }> = {
  pending: { tone: "warning", label: "Pending review" },
  verified: { tone: "success", label: "Verified" },
  rejected: { tone: "danger", label: "Rejected" },
};

export default function Verification() {
  const { user } = useAuthStore();
  const [verification, setVerification] = useState<DriverVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("car");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const v = await getVerification(user.id);
        if (v) {
          setVerification(v);
          setLicenseNumber(v.license_number);
          setVehicleType(v.vehicle_type || "car");
          setVehicleNumber(v.vehicle_number || "");
        }
      } catch (e) {
        console.error("Failed to load verification:", e);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !licenseNumber) return;
    setSubmitting(true);
    try {
      let licensePhotoUrl: string | undefined;
      if (licenseFile) {
        const ext = licenseFile.name.split(".").pop();
        const path = `${user.id}/license.${ext}`;
        await supabase.storage.from("driver-documents").upload(path, licenseFile, { upsert: true });
        const { data } = supabase.storage.from("driver-documents").getPublicUrl(path);
        licensePhotoUrl = data.publicUrl;
      }
      const v = await submitVerification({
        user_id: user.id,
        license_number: licenseNumber,
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        license_photo: licensePhotoUrl,
      });
      setVerification(v);
    } catch (e) {
      console.error("Submission failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <PageShell className="grid place-items-center">
        <Spinner className="size-8" />
      </PageShell>
    );

  const isVerified = verification?.verification_status === "verified";
  const status = verification ? STATUS[verification.verification_status] || STATUS.pending : null;

  return (
    <PageShell>
      <Container size="5xl" className="max-w-2xl">
        <h1 className="flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-foreground">
          <span className="grid size-10 place-items-center rounded-2xl bg-accent-soft text-accent-strong">
            <ShieldCheck className="size-5" />
          </span>
          Verification
        </h1>
        <p className="mt-1 text-muted-foreground">Submit your documents to start offering rides.</p>

        {status && (
          <Reveal>
            <Panel className="mt-6 flex items-center gap-3">
              <span
                className={cn(
                  "grid size-10 place-items-center rounded-xl",
                  isVerified ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {isVerified ? <CheckCircle2 className="size-5" /> : <ShieldCheck className="size-5" />}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Status</p>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
            </Panel>
          </Reveal>
        )}

        <Reveal delay={0.05}>
          <Panel inset="lg" className="mt-4 space-y-5">
            <Field
              label="Licence number *"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="DL-XXXXXXXXXX"
              icon={<FileText className="size-4" />}
              required
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Vehicle type</label>
              <div className="grid grid-cols-3 gap-3">
                {VEHICLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => setVehicleType(v.key)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-sm font-semibold transition-colors",
                      vehicleType === v.key
                        ? "border-accent bg-accent-soft text-accent-strong"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v.icon}
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="Vehicle number"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="HR-XX-XX-XXXX"
              icon={<Car className="size-4" />}
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-foreground">Licence photo</label>
              <label
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors",
                  licenseFile ? "border-accent bg-accent-soft/40" : "border-border bg-muted/40 hover:border-accent",
                )}
              >
                {licenseFile ? (
                  <CheckCircle2 className="size-7 text-success" />
                ) : (
                  <Upload className="size-7 text-muted-foreground" />
                )}
                <span className={cn("text-sm", licenseFile ? "font-semibold text-foreground" : "text-muted-foreground")}>
                  {licenseFile ? licenseFile.name : "Click to upload licence photo"}
                </span>
                <input type="file" accept="image/*" onChange={(e) => setLicenseFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>

            <Button
              className="w-full"
              variant={isVerified ? "accent" : "primary"}
              onClick={handleSubmit}
              loading={submitting}
              disabled={isVerified}
              icon={!submitting ? isVerified ? <CheckCircle2 className="size-4" /> : <ShieldCheck className="size-4" /> : undefined}
            >
              {isVerified ? "Already verified" : verification ? "Update documents" : "Submit for verification"}
            </Button>
          </Panel>
        </Reveal>
      </Container>
    </PageShell>
  );
}
