"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { UpdateUserRequest } from "../../domain/ports/IAuthService";
import { useTheme } from "../../components/ThemeProvider";
import { THEME_REGISTRY, type ThemeId } from "../../components/theme/registry";
import BlueprintGrid from "../../components/theme/BlueprintGrid";
import TitleBlock from "../../components/theme/TitleBlock";

export default function ProfilePage() {
  const { user, updateUser, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = useState<UpdateUserRequest>(() => ({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
    phone: user?.phone || "",
  }));

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user && !formData.email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        address: user.address,
        city: user.city,
        country: user.country,
        phone: user.phone,
      });
    }
  }, [user, formData.email]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-secondary"></div>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateUser(user.id, formData);
      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile", error);
      setMessage("Failed to update profile.");
    }
  };

  const inputCls =
    "w-full border border-outline bg-surface-2/60 px-4 py-2.5 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary";

  return (
    <BlueprintGrid className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto w-full max-w-2xl px-4 pt-4">
        <TitleBlock code="VMKT-BP-PRO" rev="C" date={new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" })} />
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tight text-on-surface">
            Configuración de cuenta
          </h1>
          <p className="mt-2 text-sm text-on-surface-muted">
            Manage your personal information and preferences
          </p>
        </div>

        {/* ── Theme selector ─────────────────────────── */}
        <section aria-labelledby="theme-heading" className="mb-8 border border-outline bg-surface-1/40 p-5">
          <h2 id="theme-heading" className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-secondary">
            Selección de tema
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {THEME_REGISTRY.map((def) => {
              const isActive = theme === def.id;
              return (
                <label
                  key={def.id}
                  className={`relative flex flex-col gap-2 border p-3 transition-colors ${
                    isActive
                      ? "border-secondary bg-secondary/10"
                      : "border-outline bg-surface-2/60"
                  } ${def.disabled ? "opacity-60" : "cursor-pointer"}`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={def.id}
                    checked={isActive}
                    disabled={def.disabled}
                    aria-label={def.name}
                    onChange={() => setTheme(def.id as ThemeId)}
                    className="sr-only"
                  />
                  <span className="font-mono text-sm font-bold uppercase tracking-widest text-on-surface">
                    {def.name.toUpperCase()}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                    {def.description}
                  </span>
                  {isActive ? (
                    <span className="absolute top-2 right-2 border border-secondary px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-secondary">
                      ACTIVO
                    </span>
                  ) : null}
                  {def.disabled ? (
                    <span className="absolute top-2 right-2 border border-warning px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-warning">
                      PRÓXIMAMENTE
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </section>

        {/* ── Personal profile form ──────────────────── */}
        <section aria-labelledby="profile-heading" className="border border-outline bg-surface-1/40">
          <div className="border-b border-outline px-6 py-3">
            <h2 id="profile-heading" className="font-mono text-xs uppercase tracking-[0.2em] text-secondary">
              Personal Profile
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 p-6">
            {message && (
              <div
                className={`border px-4 py-3 text-sm font-medium ${
                  message.includes("success")
                    ? "border-success/50 bg-success/10 text-success"
                    : "border-error/50 bg-error/10 text-error"
                }`}
              >
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                  First Name
                </label>
                <input name="firstName" value={formData.firstName || ""} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                  Last Name
                </label>
                <input name="lastName" value={formData.lastName || ""} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                className={`${inputCls} cursor-not-allowed opacity-60`}
                disabled
              />
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-on-surface-muted italic">
                Email address cannot be modified for security.
              </p>
            </div>

            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                Mailing Address
              </label>
              <input name="address" value={formData.address || ""} onChange={handleChange} className={inputCls} placeholder="Residential address" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                  City
                </label>
                <input name="city" value={formData.city || ""} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                  Country
                </label>
                <input name="country" value={formData.country || ""} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="mb-2 block font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                Phone Number
              </label>
              <input name="phone" value={formData.phone || ""} onChange={handleChange} className={inputCls} placeholder="+1..." />
            </div>

            <div className="flex justify-end border-t border-outline pt-6">
              <button
                type="submit"
                className="min-h-12 border border-secondary bg-secondary/10 px-8 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </BlueprintGrid>
  );
}
