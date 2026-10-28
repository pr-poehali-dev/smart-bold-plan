import { createFileRoute } from "@tanstack/react-router";
import Printing from "@/pages/Printing";

export const Route = createFileRoute("/printing")({
  component: Printing,
});
