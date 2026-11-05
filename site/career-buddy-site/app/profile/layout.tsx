import type { ReactNode } from "react";

import ProtectedRoute from "../../components/ProtectedRoute";

interface ProfileLayoutProps {
  children: ReactNode;
}

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
