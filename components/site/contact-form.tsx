"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitContact } from "@/server/actions/contact";
import { contactFormSchema, type ContactFormValues } from "@/lib/validation/contact";
import type { LocaleCode } from "@/lib/validation/locale";

export type ContactFormLabels = {
  fields: {
    name: string;
    namePlaceholder: string;
    company: string;
    companyPlaceholder: string;
    email: string;
    emailPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    projectType: string;
    projectTypePlaceholder: string;
    message: string;
    messagePlaceholder: string;
  };
  consent: string;
  submit: string;
  submitting: string;
  successHeading: string;
  successBody: string;
  successReset: string;
  errorFallback: string;
};

// Every label/placeholder arrives as a prop from the server page's own
// getTranslations() call — mounting NextIntlClientProvider just for this
// island isn't worth it, matching every other page on the site, none of
// which mount next-intl's Link/Provider either.
export function ContactForm({
  locale,
  labels,
  projectTypes,
  defaultProjectType,
}: {
  locale: LocaleCode;
  labels: ContactFormLabels;
  projectTypes: string[];
  defaultProjectType?: string;
}) {
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // `Date.now()` is impure — it belongs in an effect (post-render), not the
  // render body, so the mount timestamp is captured here rather than at
  // `useRef(Date.now())`.
  useEffect(() => {
    startedAtRef.current = Date.now();
  }, []);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      projectType: defaultProjectType ?? "",
      message: "",
      consent: false,
    },
  });

  async function onSubmit(values: ContactFormValues) {
    setFormError(null);
    try {
      const result = await submitContact({
        ...values,
        honeypot: honeypotRef.current?.value ?? "",
        startedAt: startedAtRef.current ?? Date.now(),
        locale,
      });

      if (result.ok) {
        setSuccess(true);
        form.reset({ ...values, name: "", company: "", email: "", phone: "", projectType: "", message: "", consent: false });
        return;
      }

      if (result.fields) {
        for (const [name, message] of Object.entries(result.fields)) {
          form.setError(name as keyof ContactFormValues, { message });
        }
      } else {
        setFormError(result.message);
      }
    } catch {
      setFormError(labels.errorFallback);
    }
  }

  // Success keeps the page context (hero/details/map stay mounted around
  // this island) rather than blanking it.
  if (success) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-muted/40 p-8">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 aria-hidden="true" className="size-6" />
        </span>
        <h3 className="font-heading text-xl font-semibold text-foreground">{labels.successHeading}</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{labels.successBody}</p>
        <Button type="button" variant="outline" onClick={() => setSuccess(false)} className="mt-2">
          {labels.successReset}
        </Button>
      </div>
    );
  }

  const { errors, isSubmitting } = form.formState;

  return (
    <form
      onSubmit={(event) => {
        void form.handleSubmit(onSubmit)(event);
      }}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Honeypot — real visitors never see or fill this; a filled value or
          a sub-3s submission is checked server-side and handled silently,
          never revealing the check to the client. Not `display:none` —
          some bots skip hidden fields via computed style, so this is
          visually clipped instead. */}
      <div aria-hidden="true" className="absolute h-px w-px overflow-hidden" style={{ clip: "rect(0 0 0 0)" }}>
        <label htmlFor="contact-website">Site web</label>
        <input id="contact-website" ref={honeypotRef} type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">{labels.fields.name}</Label>
          <Input
            id="contact-name"
            placeholder={labels.fields.namePlaceholder}
            aria-invalid={Boolean(errors.name)}
            {...form.register("name")}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-company">{labels.fields.company}</Label>
          <Input
            id="contact-company"
            placeholder={labels.fields.companyPlaceholder}
            aria-invalid={Boolean(errors.company)}
            {...form.register("company")}
          />
          {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-email">{labels.fields.email}</Label>
          <Input
            id="contact-email"
            type="email"
            dir="ltr"
            className="text-start"
            placeholder={labels.fields.emailPlaceholder}
            aria-invalid={Boolean(errors.email)}
            {...form.register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-phone">{labels.fields.phone}</Label>
          <Input
            id="contact-phone"
            type="tel"
            dir="ltr"
            className="text-start"
            placeholder={labels.fields.phonePlaceholder}
            aria-invalid={Boolean(errors.phone)}
            {...form.register("phone")}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-project-type">{labels.fields.projectType}</Label>
        <Controller
          name="projectType"
          control={form.control}
          render={({ field }) => (
            <Select
              items={projectTypes.map((type) => ({ value: type, label: type }))}
              value={field.value || null}
              onValueChange={(value) => field.onChange(value ?? "")}
            >
              <SelectTrigger id="contact-project-type" className="w-full" aria-invalid={Boolean(errors.projectType)}>
                <SelectValue placeholder={labels.fields.projectTypePlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.projectType && <p className="text-xs text-destructive">{errors.projectType.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-message">{labels.fields.message}</Label>
        <Textarea
          id="contact-message"
          rows={5}
          placeholder={labels.fields.messagePlaceholder}
          aria-invalid={Boolean(errors.message)}
          {...form.register("message")}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2.5">
          <Controller
            name="consent"
            control={form.control}
            render={({ field }) => (
              <Checkbox
                id="contact-consent"
                checked={field.value}
                onCheckedChange={field.onChange}
                aria-invalid={Boolean(errors.consent)}
                className="mt-0.5"
              />
            )}
          />
          <Label htmlFor="contact-consent" className="text-sm font-normal text-muted-foreground">
            {labels.consent}
          </Label>
        </div>
        {errors.consent && <p className="text-xs text-destructive">{errors.consent.message}</p>}
      </div>

      {formError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="self-start px-6">
        {isSubmitting ? labels.submitting : labels.submit}
      </Button>
    </form>
  );
}
