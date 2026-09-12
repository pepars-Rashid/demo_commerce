"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import type { CategoryOption } from "@/lib/category-depth";

interface CategoryTreeSelectProps {
  options: CategoryOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  currentParentId?: number;
  maxDepth?: number;
  showArchived?: boolean;
  showNoneOption?: boolean;
  className?: string;
}

interface TreeNode {
  id: number;
  categoryName: string;
  parentCategoryId: number | null;
  depth: number;
  archived?: boolean;
  children: TreeNode[];
}

function buildTree(options: CategoryOption[]): TreeNode[] {
  const nodeMap = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const opt of options) {
    nodeMap.set(opt.id, { ...opt, children: [] });
  }

  for (const opt of options) {
    const node = nodeMap.get(opt.id)!;
    if (opt.parentCategoryId != null && nodeMap.has(opt.parentCategoryId)) {
      nodeMap.get(opt.parentCategoryId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

function hasSelectedDescendant(node: TreeNode, value: string): boolean {
  if (String(node.id) === value) return true;
  return node.children.some((child) => hasSelectedDescendant(child, value));
}

const depthBg: Record<number, string> = {
  1: "",
  2: "bg-muted/60",
  3: "bg-muted",
};

function TreeItem({
  node,
  value,
  onValueChange,
  currentParentId,
  maxDepth,
  showArchived,
}: {
  node: TreeNode;
  value: string;
  onValueChange: (value: string) => void;
  currentParentId?: number;
  maxDepth: number;
  showArchived?: boolean;
}) {
  const [expanded, setExpanded] = useState(() => hasSelectedDescendant(node, value));
  const hasChildren = node.children.length > 0;
  const isBlocked = node.depth >= maxDepth && node.id !== currentParentId;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className={cn("flex items-center rounded-sm", depthBg[node.depth] ?? "")}>
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex h-7 w-6 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={expanded ? "طي" : "توسيع"}
            >
              <ChevronLeft
                className={cn(
                  "size-4 transition-transform",
                  expanded && "-rotate-90",
                )}
              />
            </button>
          </CollapsibleTrigger>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        <SelectItem
          value={String(node.id)}
          disabled={isBlocked}
          className="flex-1"
        >
          <span className={cn("flex items-center gap-1", node.depth === 1 && "font-medium")}>
            {node.categoryName}
          </span>
          {showArchived && node.archived && (
            <Badge variant="secondary" className="ms-auto shrink-0 text-[10px] leading-none">
              مؤرشفة
            </Badge>
          )}
        </SelectItem>
      </div>

      <CollapsibleContent>
        <div>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              value={value}
              onValueChange={onValueChange}
              currentParentId={currentParentId}
              maxDepth={maxDepth}
              showArchived={showArchived}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function CategoryTreeSelect({
  options,
  value,
  onValueChange,
  disabled = false,
  placeholder = "بدون أب (تصنيف رئيسي)",
  currentParentId,
  maxDepth = 3,
  showArchived = false,
  showNoneOption = true,
  className,
}: CategoryTreeSelectProps) {
  const tree = buildTree(options);

  return (
    <div className={className}>
      <Select value={value || "__none"} onValueChange={(v) => onValueChange(v === "__none" ? "" : v)} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <SelectItem value="__none" disabled>
              <span className="text-muted-foreground">لا توجد تصنيفات</span>
            </SelectItem>
          ) : (
            <>
              {showNoneOption && (
                <SelectItem value="__none">{placeholder}</SelectItem>
              )}

              {tree.map((node) => (
                <TreeItem
                  key={node.id}
                  node={node}
                  value={value}
                  onValueChange={onValueChange}
                  currentParentId={currentParentId}
                  maxDepth={maxDepth}
                  showArchived={showArchived}
                />
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

