import type { ReactNode } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";

interface ProjectsLayoutProps {
  children: ReactNode;
}

export default function ProjectsLayout({ children }: ProjectsLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
