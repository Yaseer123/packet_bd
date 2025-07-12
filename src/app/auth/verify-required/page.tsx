import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailWarning } from "lucide-react";

// Shadcn Card imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyRequiredPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-muted py-8">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <MailWarning className="mb-2 h-12 w-12 text-primary" />
          <CardTitle className="mb-2 text-center text-2xl font-bold">
            Email Verification Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle className="text-lg font-semibold tracking-wide">
              Access Restricted
            </AlertTitle>
            <AlertDescription className="text-base text-muted-foreground">
              Your account could not be accessed because your email address is
              <span className="font-bold text-destructive"> not verified</span>.
            </AlertDescription>
          </Alert>
          <p className="mb-6 text-center text-base leading-relaxed text-muted-foreground">
            <span className="mb-2 block">
              Please check your email for a verification link.
            </span>
            <span className="mb-2 block">
              If you can&apos;t find the email, make sure to check your
              <span className="mx-1 rounded bg-gradient-to-r from-yellow-200 to-yellow-400 px-1 font-semibold text-yellow-900">
                All Mails
              </span>
              ,
              <span className="mx-1 rounded bg-gradient-to-r from-pink-200 to-pink-400 px-1 font-semibold text-pink-900">
                Spam
              </span>{" "}
              and
              <span className="mx-1 rounded bg-gradient-to-r from-blue-200 to-blue-400 px-1 font-semibold text-blue-900">
                Promotionals
              </span>{" "}
              folder.
            </span>
            <span className="block">
              If you did not receive any email, you may need to register with a
              different email address or contact support.
            </span>
          </p>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center text-base shadow-sm">
              <span className="mb-1 block font-medium text-primary">
                Need help?
              </span>
              <span className="mb-1 block">
                Mail us at
                <a
                  href="mailto:contact@rinors.com"
                  className="ml-1 font-semibold text-blue-700 underline transition-colors hover:text-blue-900"
                >
                  contact@rinors.com
                </a>
              </span>
              <span className="block">
                or call us at
                <a
                  href="tel:+8801312223452"
                  className="ml-1 font-semibold text-green-700 underline transition-colors hover:text-green-900"
                >
                  +8801312223452
                </a>
              </span>
              <span className="mt-2 block text-xs text-muted-foreground">
                We&apos;re here to assist you 24/7!
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
