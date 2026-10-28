import { createFileRoute } from "@tanstack/react-router";
import Partner from "@/pages/Partner";

export const Route = createFileRoute("/partner")({
  component: Partner,
});
