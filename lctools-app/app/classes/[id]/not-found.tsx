import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ClassNotFound() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <h1 className="mb-4 text-4xl font-bold">Class Not Found</h1>
      <p className="mb-8 text-center text-muted-foreground">
        The class you&apos;re looking for doesn&apos;t exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/classes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Link>
      </Button>
    </div>
  );
}
