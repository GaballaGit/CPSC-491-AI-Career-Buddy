import type { ReactNode } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";

interface RoadmapLayoutProps {
  children: ReactNode;
}

export default function RoadmapLayout({ children }: RoadmapLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
