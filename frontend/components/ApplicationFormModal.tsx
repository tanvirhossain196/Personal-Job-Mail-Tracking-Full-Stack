"use client";

import { useState } from "react";
import { X, TriangleAlert } from "lucide-react";
import { JobApplication, JobApplicationInput, POSITION_TYPE_ORDER, STATUS_ORDER } from "@/lib/types";
import { isValidEmail, isValidUrl, cn } from "@/lib/utils";

interface ApplicationFormModalProps {
  initial?: JobApplication;
  onCancel: () => void;
  onSubmit: (
    input: JobApplicationInput,
  ) => Promise<{ duplicate?: JobApplication }> | { duplicate?: JobApplication };
  sidebarCollapsed?: boolean;
}

type FormState = {
  jobLink: string;
  companyName: string;
  position: string;
  positionType: JobApplication["positionType"];
  email: string;
  status: JobApplication["status"];
  appliedDate: string;
  followUpDate: string;
  resumeVersion: string;
  notes: string;
};

function toFormState(a?: JobApplication): FormState {
  return {
    jobLink: a?.jobLink ?? "",
    companyName: a?.companyName ?? "",
    position: a?.position ?? "",
    positionType: a?.positionType ?? "Full Stack",
    email: a?.email ?? "",
    status: a?.status ?? "Saved",
    appliedDate: a?.appliedDate?.slice(0, 10) ?? "",
    followUpDate: a?.followUpDate?.slice(0, 10) ?? "",
    resumeVersion: a?.resumeVersion ?? "",
    notes: a?.notes ?? "",
  };
}

export function ApplicationFormModal({ initial, onCancel, onSubmit, sidebarCollapsed }: ApplicationFormModalProps) {
  const [form, setForm] = useState<FormState>(toFormState(initial));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [duplicate, setDuplicate] = useState<JobApplication | undefined>();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDuplicate(undefined);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.companyName.trim()) next.companyName = "Company name is required.";
    if (!form.position.trim()) next.position = "Position is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(form.email)) next.email = "Enter a valid email address.";
    if (!form.jobLink.trim()) next.jobLink = "Job posting link is required.";
    else if (!isValidUrl(form.jobLink)) next.jobLink = "Enter a valid URL (starting with http/https).";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const input: JobApplicationInput = {
      jobLink: form.jobLink.trim(),
      companyName: form.companyName.trim(),
      position: form.position.trim(),
      positionType: form.positionType,
      email: form.email.trim(),
      applied: form.status !== "Saved",
      status: form.status,
      appliedDate: form.appliedDate ? new Date(form.appliedDate).toISOString() : undefined,
      followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
      resumeVersion: form.resumeVersion.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      setSubmitting(true);
      const result = await onSubmit(input);
      if (result.duplicate) {
        setDuplicate(result.duplicate);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-sm border border-steel-100 bg-fog-50 px-3 py-2 text-sm text-ink placeholder:text-steel-500/70 focus:bg-white focus:border-circuit outline-none transition-colors";
  const labelClass = "text-xs font-medium text-steel-700 mb-1.5 block";
  const errorClass = "text-xs text-danger mt-1";

  return (
    <div
      className={cn(
        "fixed inset-y-0 right-0 left-0 z-50 flex justify-end bg-ink/40 backdrop-blur-[1px]",
        sidebarCollapsed ? "lg:left-[68px]" : "lg:left-64",
      )}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel-slide-in h-full w-full sm:w-[480px] bg-white shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-100 shrink-0">
          <div>
            <div className="font-display font-semibold text-ink text-base">
              {initial ? "Edit application" : "Log an application"}
            </div>
            <div className="text-xs text-steel-500 mt-0.5">
              Duplicate check runs on company + position + email.
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-steel-500 hover:text-ink rounded-md p-1.5 hover:bg-fog-100 transition-colors"
            aria-label="Close form"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex-1 overflow-y-auto">
          {duplicate && (
            <div className="mb-4 flex items-start gap-2.5 rounded-sm border border-signal/30 bg-signal-100 px-3.5 py-3">
              <TriangleAlert size={16} className="text-signal-600 mt-0.5 shrink-0" />
              <div className="text-xs text-ink">
                <p className="font-medium">Already logged this application.</p>
                <p className="text-steel-700 mt-0.5">
                  {duplicate.companyName} — {duplicate.position} ({duplicate.email}) is already in
                  your tracker, marked <strong>{duplicate.status}</strong>. Edit that entry instead,
                  or change the position/email to log this as a new one.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Company name</label>
              <input
                className={inputClass}
                value={form.companyName}
                onChange={(e) => set("companyName", e.target.value)}
                placeholder="Northbridge Systems"
              />
              {errors.companyName && <p className={errorClass}>{errors.companyName}</p>}
            </div>

            <div>
              <label className={labelClass}>Position</label>
              <input
                className={inputClass}
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="Backend Engineer"
              />
              {errors.position && <p className={errorClass}>{errors.position}</p>}
            </div>

            <div>
              <label className={labelClass}>Position type</label>
              <select
                className={inputClass}
                value={form.positionType}
                onChange={(e) => set("positionType", e.target.value as JobApplication["positionType"])}
              >
                {POSITION_TYPE_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Job posting link</label>
              <input
                className={inputClass}
                value={form.jobLink}
                onChange={(e) => set("jobLink", e.target.value)}
                placeholder="https://company.com/careers/role"
              />
              {errors.jobLink && <p className={errorClass}>{errors.jobLink}</p>}
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Email used to apply</label>
              <input
                className={inputClass}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
              />
              {errors.email && <p className={errorClass}>{errors.email}</p>}
            </div>

            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as JobApplication["status"])}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Resume version</label>
              <input
                className={inputClass}
                value={form.resumeVersion}
                onChange={(e) => set("resumeVersion", e.target.value)}
                placeholder="v3 — backend focus"
              />
            </div>

            <div>
              <label className={labelClass}>Applied date</label>
              <input
                type="date"
                className={inputClass}
                value={form.appliedDate}
                onChange={(e) => set("appliedDate", e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Follow-up date</label>
              <input
                type="date"
                className={inputClass}
                value={form.followUpDate}
                onChange={(e) => set("followUpDate", e.target.value)}
              />
            </div>

            <div className="col-span-2">
              <label className={labelClass}>Notes</label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Referral, interview prep, recruiter contact..."
              />
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-steel-100 shrink-0">
          <button
            onClick={onCancel}
            className="rounded-md px-3.5 py-2 text-sm font-medium text-steel-700 hover:bg-fog-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-md bg-signal hover:bg-signal-600 text-ink px-4 py-2 text-sm font-semibold transition-colors shadow-panel disabled:opacity-60"
          >
            {submitting ? "Saving…" : initial ? "Save changes" : "Log application"}
          </button>
        </div>
      </div>
    </div>
  );
}