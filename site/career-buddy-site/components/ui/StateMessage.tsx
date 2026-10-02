import type { ReactNode } from "react";

import Card from "./Card";

interface StateMessageProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function StateMessage({
  title,
  description,
  action,
}: StateMessageProps) {
  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>

      {description ? (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Card>
  );
}
