import { createFileRoute } from "@tanstack/react-router";
import Modeling from "@/pages/Modeling";

export const Route = createFileRoute("/modeling")({
  component: Modeling,
});
