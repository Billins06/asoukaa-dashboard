'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  PowerOff,
  Power,
  Loader2,
  FolderTree,
  Plus,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryFormDialog } from './category-form-dialog';
import { toggleCategoryAction, deleteCategoryAction } from '@/server/actions/categories-actions';
import type { CategoryNode, CategoryFlat } from '@/lib/categories/types';

interface CategoriesClientProps {
  tree: CategoryNode[];
  flatList: CategoryFlat[];
}

const LEVEL_INDENT = ['', 'pl-0', 'pl-6', 'pl-12'];
const LEVEL_COLORS = ['', 'text-foreground', 'text-muted-foreground', 'text-muted-foreground/70'];
const LEVEL_SIZE = ['', 'text-[14px] font-semibold', 'text-[13px] font-medium', 'text-[13px]'];

function ToggleActiveButton({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className={`h-7 w-7 p-0 ${isActive ? 'text-muted-foreground hover:text-amber-600' : 'text-muted-foreground hover:text-emerald-600'}`}
      disabled={isPending}
      title={isActive ? 'Désactiver' : 'Activer'}
      onClick={() =>
        startTransition(async () => {
          const r = await toggleCategoryAction(id);
          if (!r.success) toast.error(r.error);
          else toast.success(isActive ? 'Catégorie désactivée' : 'Catégorie activée');
        })
      }
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isActive ? (
        <PowerOff className="h-3.5 w-3.5" />
      ) : (
        <Power className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function DeleteButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      disabled={isPending}
      title={`Supprimer "${name}"`}
      onClick={() => {
        if (!confirm(`Supprimer "${name}" ? Les sous-catégories deviendront orphelines.`)) return;
        startTransition(async () => {
          const r = await deleteCategoryAction(id);
          if (!r.success) toast.error(r.error);
          else toast.success('Catégorie supprimée');
        });
      }}
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

function CategoryRow({
  node,
  flatList,
  depth,
}: {
  node: CategoryNode;
  flatList: CategoryFlat[];
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center gap-2 px-4 py-2.5 hover:bg-muted/20 transition-colors ${LEVEL_INDENT[depth] ?? 'pl-0'}`}
      >
        <button
          type="button"
          className="shrink-0 h-5 w-5 flex items-center justify-center text-muted-foreground"
          onClick={() => setExpanded((p) => !p)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <span className={`${LEVEL_SIZE[depth] ?? 'text-[13px]'} ${LEVEL_COLORS[depth] ?? ''} ${!node.isActive ? 'line-through opacity-50' : ''}`}>
            {node.name}
          </span>
          {node.children.length > 0 && (
            <span className="ml-2 text-[11px] text-muted-foreground">
              {node.children.length} sous-cat.
            </span>
          )}
        </div>

        <Badge
          variant="outline"
          className={`text-[10px] hidden sm:inline-flex ${
            node.isActive
              ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/5'
              : 'border-slate-400/40 text-slate-500 bg-slate-500/5'
          }`}
        >
          {node.isActive ? 'Actif' : 'Inactif'}
        </Badge>

        <div className="flex items-center gap-0.5 shrink-0">
          {node.level < 3 && (
            <CategoryFormDialog
              mode="create"
              flatList={flatList}
              defaultParentId={node.id}
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                title="Ajouter une sous-catégorie"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </CategoryFormDialog>
          )}
          <CategoryFormDialog mode="edit" flatList={flatList} category={node}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              title="Modifier"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </CategoryFormDialog>
          <ToggleActiveButton id={node.id} isActive={node.isActive} />
          <DeleteButton id={node.id} name={node.name} />
        </div>
      </div>

      {expanded &&
        node.children.map((child) => (
          <CategoryRow key={child.id} node={child} flatList={flatList} depth={depth + 1} />
        ))}
    </>
  );
}

export function CategoriesClient({ tree, flatList }: CategoriesClientProps) {
  const total = flatList.length;
  const active = flatList.filter((c) => c.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          {total} catégorie{total > 1 ? 's' : ''} · {active} active{active > 1 ? 's' : ''}
        </p>
        <CategoryFormDialog mode="create" flatList={flatList} />
      </div>

      <Card>
        <CardContent className="p-0">
          {tree.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <FolderTree className="h-8 w-8 opacity-30" />
              <p className="text-sm">Aucune catégorie</p>
              <CategoryFormDialog mode="create" flatList={flatList} />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {tree.map((node) => (
                <CategoryRow key={node.id} node={node} flatList={flatList} depth={1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
