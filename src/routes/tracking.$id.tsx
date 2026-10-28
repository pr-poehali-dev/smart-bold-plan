import { createFileRoute } from "@tanstack/react-router";
import Tracking from "@/pages/Tracking";

export const Route = createFileRoute("/tracking/$id")({
  component: Tracking,
});
