import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">المستخدمين</h1>
          <p className="text-sm text-muted-foreground">
            إدارة المستخدمين والأدوار
          </p>
        </div>
      </div>
      <div className="flex h-60 items-center justify-center rounded-lg border">
        <div className="text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            سيتم إضافة جدول المستخدمين قريباً
          </p>
        </div>
      </div>
    </div>
  );
}