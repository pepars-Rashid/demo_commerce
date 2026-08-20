import { Suspense } from "react";
import { ProfileContent } from "@/components/profile/profile-content";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-6 shadow-sm">
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent />
        </Suspense>
      </div>
    </div>
  );
}