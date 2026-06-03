"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signupSchema, type SignupSchema } from "@/lib/zod/signup";
import { signupAction } from "@/lib/actions/auth";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignupSchema>({
    mode: "onBlur",
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onGoogleSignIn() {
    await signIn("google", { redirectTo: "/" });
  }

  async function onSubmit(data: SignupSchema) {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("email", data.email);
    formData.set("password", data.password);
    formData.set("confirmPassword", data.confirmPassword);

    const result = await signupAction(undefined, formData);

    if (!result.success) {
      // Duplicate email → show on email field
      if (result.error === "البريد الإلكتروني مستخدم بالفعل") {
        setError("email", { message: result.error });
      } else {
        // General error → show below submit button
        setError("root", { message: result.error });
      }
      return;
    }

    // Auto-login after successful signup
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: "/",
    });
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">إنشاء حساب جديد</CardTitle>
          <CardDescription>
            أنشئ حسابك باستخدام Google أو البريد الإلكتروني
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={onGoogleSignIn}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  التسجيل باستخدام Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                أو تابع باستخدام البريد الإلكتروني
              </FieldSeparator>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>الاسم الكامل</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="text"
                      placeholder="محمد أحمد"
                      autoComplete="name"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      البريد الإلكتروني
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      placeholder="m@example.com"
                      autoComplete="email"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Field className="grid grid-cols-2 gap-4">
                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>كلمة المرور</FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        تأكيد كلمة المرور
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        type="password"
                        autoComplete="new-password"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </Field>
              <Field>
                <FieldDescription>
                  يجب أن تكون كلمة المرور 8 أحرف على الأقل
                </FieldDescription>
              </Field>
              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
                </Button>
                {errors.root?.message && (
                  <FieldError errors={[{ message: errors.root.message }]} />
                )}
                <FieldDescription className="text-center">
                  لديك حساب بالفعل؟{" "}
                  <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    تسجيل الدخول
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        بمتابعة التسجيل، أنت توافق على{" "}
        <span className="underline underline-offset-4 hover:text-primary">
          شروط الخدمة
        </span>{" "}
        و{" "}
        <span className="underline underline-offset-4 hover:text-primary">
          سياسة الخصوصية
        </span>
        .
      </FieldDescription>
    </div>
  );
}
