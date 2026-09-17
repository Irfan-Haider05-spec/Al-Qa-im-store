"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { addAddress, deleteAddress } from "@/lib/account/actions";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const empty = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(addresses.length === 0);
  const [pending, startTransition] = useTransition();

  const set = (k: keyof typeof empty, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await addAddress(form);
      if (res.ok) {
        setForm(empty);
        setShowForm(false);
      } else {
        setError(res.error ?? "Could not save address.");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteAddress(id);
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Addresses</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="text-sm text-primary hover:underline"
        >
          {showForm ? "Cancel" : "Add address"}
        </button>
      </div>

      {addresses.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li
              key={a.id}
              className="relative rounded-card border border-border p-4"
            >
              {a.isDefault && (
                <span className="absolute right-3 top-3 rounded-pill bg-primary/10 px-2 py-0.5 text-xs text-primary-deep">
                  Default
                </span>
              )}
              <p className="font-medium">{a.fullName}</p>
              <p className="text-sm text-muted-foreground">{a.line1}</p>
              {a.line2 && (
                <p className="text-sm text-muted-foreground">{a.line2}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {[a.city, a.state, a.postalCode].filter(Boolean).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground">{a.country}</p>
              <p className="text-sm text-muted-foreground">{a.phone}</p>
              <button
                onClick={() => remove(a.id)}
                aria-label="Delete address"
                className="mt-3 inline-flex items-center gap-1 text-xs text-danger hover:underline"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="rounded-card border border-border p-5">
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ["fullName", "Full name", false],
                ["phone", "Phone", false],
                ["line1", "Address", false],
                ["line2", "Apartment (optional)", false],
                ["city", "City", true],
                ["state", "State", true],
                ["postalCode", "Postal code", true],
                ["country", "Country", true],
              ] as [keyof typeof empty, string, boolean][]
            ).map(([name, label, half]) => (
              <div key={name} className={half ? "col-span-1" : "col-span-2"}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  value={form[name]}
                  onChange={(e) => set(name, e.target.value)}
                  className="w-full rounded-control border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <button
            onClick={save}
            disabled={pending}
            className="mt-4 inline-flex h-10 items-center rounded-pill bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary-deep disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save address"}
          </button>
        </div>
      )}
    </div>
  );
}
