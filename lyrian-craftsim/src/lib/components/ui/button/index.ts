import Root from "./button.svelte";

type ButtonProps = {
  variant?: "default" | "primary" | "warning" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  class?: string;
} & HTMLButtonElement;

export {
  Root as Button,
  type ButtonProps
};
