import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ProductsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24 hidden sm:block" />
              <Skeleton className="h-4 w-20 hidden md:block" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-20 ml-auto" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
