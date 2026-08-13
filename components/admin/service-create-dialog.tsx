"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createServiceAction } from "@/server/actions/services";

// Minimal on purpose — just the FR title needed to create the row. Icon,
// hero, blocks and EN/AR translations are filled on the edit page this
// redirects to right after, same as the rest of ServiceForm's fields.
export function ServiceCreateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setPending(true);
    setError(null);
    const result = await createServiceAction({ title: title.trim() });
    if (result.ok) {
      setOpen(false);
      setTitle("");
      router.push(`/admin/services/${result.data.serviceId}`);
    } else {
      setPending(false);
      setError(result.message);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTitle("");
          setError(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button type="button">
            <Plus aria-hidden="true" />
            Nouveau service
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau service</DialogTitle>
          <DialogDescription>
            Le titre en français suffit pour créer la ligne — icône, image, contenu et autres langues se
            renseignent ensuite sur sa fiche.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="service-create-title">
            Titre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="service-create-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre du service"
            autoFocus
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Annuler
          </Button>
          <Button type="button" onClick={handleCreate} disabled={pending}>
            {pending ? "Création…" : "Créer le service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
