<script lang="ts">
  import { cn } from "$lib/utils";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type $$Props = HTMLButtonAttributes & {
    variant?: "default" | "primary" | "warning" | "destructive" | "outline" | "ghost" | "link";
    size?: "default" | "sm" | "lg";
    class?: string;
  };

  let className: $$Props["class"] = undefined;
  export let variant: NonNullable<$$Props["variant"]> = "default";
  export let size: NonNullable<$$Props["size"]> = "default";
  export { className as class };

  const variants: Record<NonNullable<$$Props["variant"]>, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    warning: "bg-warning text-warning-foreground hover:bg-warning/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  };

  const sizes: Record<NonNullable<$$Props["size"]>, string> = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8"
  };
</script>

<button
  class={cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  )}
  {...$$restProps}
  on:click
>
  <slot />
</button>
