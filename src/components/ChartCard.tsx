import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  loading?: boolean;
  className?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  description,
  action,
  loading,
  className,
  children,
}: Props) {
  return (
    <Card className={className}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-[260px] w-full" /> : children}
      </CardContent>
    </Card>
  );
}
