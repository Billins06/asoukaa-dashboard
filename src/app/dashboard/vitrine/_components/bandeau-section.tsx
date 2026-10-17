'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, Sparkles } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUploadField, ImagePreview } from '@/components/image-upload-field';
import { LocalDate } from '@/components/local-date';
import { saveBandeauAction } from '@/server/actions/vitrine-actions';
import type { Bandeau } from '@/lib/vitrine/types';
import { ToggleSwitch } from './toggle-switch';

const TITRE_MAX = 120;
const SOUS_TITRE_MAX = 200;

export function BandeauSection({ bandeau }: { bandeau: Bandeau | null }) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    titre: bandeau?.titre ?? '',
    sousTitre: bandeau?.sousTitre ?? '',
    imageUrl: bandeau?.imageUrl ?? '',
    isActive: bandeau?.isActive ?? true,
  });

  const titre = form.titre.trim();
  const sousTitre = form.sousTitre.trim();

  const handleSave = () => {
    if (!titre) {
      toast.error('Le titre est obligatoire.');
      return;
    }
    if (titre.length > TITRE_MAX) {
      toast.error(`Le titre ne doit pas dépasser ${TITRE_MAX} caractères.`);
      return;
    }
    if (sousTitre.length > SOUS_TITRE_MAX) {
      toast.error(`Le sous-titre ne doit pas dépasser ${SOUS_TITRE_MAX} caractères.`);
      return;
    }
    startTransition(async () => {
      const result = await saveBandeauAction({
        titre,
        sousTitre: sousTitre || null,
        imageUrl: form.imageUrl.trim() || null,
        isActive: form.isActive,
      });
      if (result.success) toast.success('Bandeau enregistré');
      else toast.error(result.error);
    });
  };

  const busy = isPending || uploading;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[15px]">
          <Sparkles className="h-4 w-4 text-primary" />
          Bandeau de « Pour vous »
          {!bandeau && (
            <Badge variant="outline" className="text-[10px] border-slate-400/40 text-slate-500 bg-slate-500/5">
              Non configuré
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-[12px]">
          Bannière affichée en tête de l&apos;onglet « Pour vous » de l&apos;application.
          {bandeau?.updatedAt && (
            <>
              {' '}Dernière mise à jour : <LocalDate iso={bandeau.updatedAt} pattern="d MMM yyyy 'à' HH:mm" />.
            </>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-2">
        {/* Aperçu en direct */}
        <div className="space-y-1.5">
          <Label className="text-[12px] text-muted-foreground">Aperçu</Label>
          {/* Reproduit le bandeau de l'appli : fond #FFEDE3, texte à gauche, image à droite */}
          <div
            className={`relative flex h-40 items-stretch gap-3 overflow-hidden rounded-2xl p-4 ${
              form.isActive ? '' : 'opacity-50 grayscale'
            }`}
            style={{ backgroundColor: '#FFEDE3' }}
          >
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <p
                className={`text-[17px] font-bold leading-tight line-clamp-3 ${titre ? '' : 'opacity-40'}`}
                style={{ color: '#1F1F1F' }}
              >
                {titre || 'Titre du bandeau'}
              </p>
              {sousTitre && (
                <p className="mt-1.5 text-[12px] leading-snug line-clamp-3" style={{ color: '#5C4A3F' }}>
                  {sousTitre}
                </p>
              )}
            </div>
            <div className="w-2/5 shrink-0">
              {form.imageUrl ? (
                <ImagePreview
                  src={form.imageUrl}
                  alt="Image du bandeau"
                  className="h-full w-full rounded-xl"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-[#E9C9B5] text-[11px] text-[#A07E69]">
                  Aucune image
                </div>
              )}
            </div>
            {!form.isActive && (
              <span className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] text-white">
                Masqué
              </span>
            )}
          </div>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bandeau-titre" className="text-[13px]">
                Titre <span className="text-destructive">*</span>
              </Label>
              <span className={`text-[11px] ${titre.length > TITRE_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
                {titre.length}/{TITRE_MAX}
              </span>
            </div>
            <Input
              id="bandeau-titre"
              placeholder="Ex : Les bons plans de la semaine"
              value={form.titre}
              maxLength={TITRE_MAX + 20}
              onChange={(e) => setForm((p) => ({ ...p, titre: e.target.value }))}
              className="text-[13px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bandeau-sous-titre" className="text-[13px]">Sous-titre</Label>
              <span className={`text-[11px] ${sousTitre.length > SOUS_TITRE_MAX ? 'text-destructive' : 'text-muted-foreground'}`}>
                {sousTitre.length}/{SOUS_TITRE_MAX}
              </span>
            </div>
            <Input
              id="bandeau-sous-titre"
              placeholder="Ex : Jusqu'à -50 % sur une sélection de produits"
              value={form.sousTitre}
              maxLength={SOUS_TITRE_MAX + 20}
              onChange={(e) => setForm((p) => ({ ...p, sousTitre: e.target.value }))}
              className="text-[13px]"
              disabled={isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px]">Image</Label>
            <ImageUploadField
              type="vitrine"
              shape="banner"
              value={form.imageUrl}
              onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
              onUploadingChange={setUploading}
              disabled={isPending}
              hint="Image carrée ou légèrement horizontale conseillée"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <label className="flex items-center gap-2 text-[13px]">
              <ToggleSwitch
                checked={form.isActive}
                onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                disabled={isPending}
                label="Bandeau actif"
              />
              {form.isActive ? 'Actif (visible)' : 'Inactif (masqué)'}
            </label>
            <Button onClick={handleSave} disabled={busy} className="h-9 gap-1.5">
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
