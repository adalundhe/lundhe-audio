"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Camera, Loader2, Mail, PencilLine, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";

type ProfileSummary = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string | null;
  initials: string;
  memberSince: string;
};

type NoticeState =
  | {
      message: string;
      type: "error" | "success";
    }
  | null;

const PROFILE_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_PROFILE_IMAGE_DIMENSION = 128;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const NAME_ALLOWED_CHARACTERS_PATTERN = /^[\p{L}\p{M} .'\-’]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_CODE_PATTERN = /^\d{6}$/;

export function ProfileCard({ profile }: { profile: ProfileSummary }) {
  const router = useRouter();
  const { isLoaded, user } = useUser();
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const [notice, setNotice] = React.useState<NoticeState>(null);
  const [nameDialogOpen, setNameDialogOpen] = React.useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [firstName, setFirstName] = React.useState(profile.firstName);
  const [lastName, setLastName] = React.useState(profile.lastName);
  const [newEmail, setNewEmail] = React.useState(profile.email);
  const [verificationCode, setVerificationCode] = React.useState("");
  const [pendingEmailAddressId, setPendingEmailAddressId] = React.useState<
    string | null
  >(null);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isSavingName, setIsSavingName] = React.useState(false);
  const [isSendingVerificationCode, setIsSendingVerificationCode] =
    React.useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = React.useState(false);
  const actionButtonClassName =
    "w-full justify-center border border-black px-3 hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black sm:w-auto";

  const currentFirstName = user?.firstName ?? profile.firstName;
  const currentLastName = user?.lastName ?? profile.lastName;
  const currentFullName = getFullName(
    user?.fullName ?? profile.fullName,
    currentFirstName,
    currentLastName,
  );
  const currentEmail = getPrimaryEmail(user) ?? profile.email;
  const currentInitials = getInitials(
    currentFirstName,
    currentLastName,
    profile.initials,
  );
  const currentImageUrl = user?.imageUrl ?? profile.imageUrl;

  React.useEffect(() => {
    setFirstName(currentFirstName);
    setLastName(currentLastName);
  }, [currentFirstName, currentLastName]);

  const handlePhotoButtonClick = () => {
    setNotice(null);
    photoInputRef.current?.click();
  };

  const handlePhotoSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length !== 1) {
      setNotice({
        type: "error",
        message: "Select a single image for your profile photo.",
      });
      return;
    }

    if (!isLoaded || !user) {
      setNotice({
        type: "error",
        message: "Your account session is still loading. Try again in a moment.",
      });
      return;
    }

    try {
      setIsUploadingPhoto(true);
      setNotice(null);
      const file = selectedFiles[0];

      if (!file) {
        setNotice({
          type: "error",
          message: "Select a single image for your profile photo.",
        });
        return;
      }

      const photoValidationError = await validateProfilePhoto(file);

      if (photoValidationError) {
        setNotice({
          type: "error",
          message: photoValidationError,
        });
        return;
      }

      await user.setProfileImage({ file });
      await user.reload();
      router.refresh();
      setNotice({
        type: "success",
        message: "Profile photo updated.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message: getClerkErrorMessage(
          error,
          "Unable to update your profile photo.",
        ),
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleNameDialogOpenChange = (open: boolean) => {
    setNameDialogOpen(open);
    setNameError(null);

    if (open) {
      setFirstName(currentFirstName);
      setLastName(currentLastName);
    }
  };

  const handleNameSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !user) {
      setNameError("Your account session is still loading. Try again in a moment.");
      return;
    }

    const trimmedFirstName = normalizeName(firstName);
    const trimmedLastName = normalizeName(lastName);
    const validatedName = validateNameFields(trimmedFirstName, trimmedLastName);

    if (validatedName) {
      setNameError(validatedName);
      return;
    }

    try {
      setIsSavingName(true);
      setNameError(null);
      setNotice(null);
      setFirstName(trimmedFirstName);
      setLastName(trimmedLastName);
      await user.update({
        firstName: trimmedFirstName || null,
        lastName: trimmedLastName || null,
      });
      await user.reload();
      router.refresh();
      setNameDialogOpen(false);
      setNotice({
        type: "success",
        message: "Your name has been updated.",
      });
    } catch (error) {
      setNameError(
        getClerkErrorMessage(error, "Unable to update your name right now."),
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const handleEmailDialogOpenChange = (open: boolean) => {
    setEmailDialogOpen(open);

    if (open) {
      setNewEmail(currentEmail);
    } else {
      setVerificationCode("");
      setPendingEmailAddressId(null);
    }

    setEmailError(null);
  };

  const handleSendVerificationCode = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!isLoaded || !user) {
      setEmailError("Your account session is still loading. Try again in a moment.");
      return;
    }

    const normalizedEmail = normalizeEmail(newEmail);
    const validatedEmail = validateEmailAddress(
      normalizedEmail,
      normalizeEmail(currentEmail),
    );

    if (validatedEmail) {
      setEmailError(validatedEmail);
      return;
    }

    try {
      setIsSendingVerificationCode(true);
      setEmailError(null);
      setNotice(null);
      setNewEmail(normalizedEmail);

      const existingEmailAddress = user.emailAddresses.find(
        (emailAddress) =>
          emailAddress.emailAddress.toLowerCase() === normalizedEmail,
      );
      const emailAddress =
        existingEmailAddress ??
        (await user.createEmailAddress({ email: normalizedEmail }));

      await emailAddress.prepareVerification({ strategy: "email_code" });
      setPendingEmailAddressId(emailAddress.id);
      setVerificationCode("");
    } catch (error) {
      setEmailError(
        getClerkErrorMessage(
          error,
          "Unable to send a verification code to that email.",
        ),
      );
    } finally {
      setIsSendingVerificationCode(false);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isLoaded || !user) {
      setEmailError("Your account session is still loading. Try again in a moment.");
      return;
    }

    if (!pendingEmailAddressId) {
      setEmailError("Start the email verification flow again.");
      return;
    }

    const trimmedCode = normalizeVerificationCode(verificationCode);
    const verificationCodeError = validateVerificationCode(trimmedCode);

    if (verificationCodeError) {
      setEmailError(verificationCodeError);
      return;
    }

    try {
      setIsVerifyingEmail(true);
      setEmailError(null);
      setNotice(null);
      setVerificationCode(trimmedCode);

      const refreshedUser = await user.reload();
      const emailAddress = refreshedUser.emailAddresses.find(
        (address) => address.id === pendingEmailAddressId,
      );

      if (!emailAddress) {
        throw new Error("That verification session expired. Start again.");
      }

      const verificationResult = await emailAddress.attemptVerification({
        code: trimmedCode,
      });

      if (verificationResult.verification.status !== "verified") {
        throw new Error("That verification code was not accepted.");
      }

      await refreshedUser.update({
        primaryEmailAddressId: emailAddress.id,
      });
      await refreshedUser.reload();
      router.refresh();
      setEmailDialogOpen(false);
      setPendingEmailAddressId(null);
      setVerificationCode("");
      setNotice({
        type: "success",
        message: "Your primary email has been updated.",
      });
    } catch (error) {
      setEmailError(
        getClerkErrorMessage(error, "Unable to verify that email address."),
      );
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  return (
    <Card className="self-start xl:h-full xl:self-stretch">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Your account details and delivery contact.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={currentImageUrl ?? "/placeholder.svg"}
                alt={currentFullName}
              />
              <AvatarFallback className="text-lg">
                {currentInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <p className="text-lg font-medium">{currentFullName}</p>
              <p className="text-sm text-muted-foreground">
                Member since {profile.memberSince}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={handlePhotoSelection}
            />
            <Button
              type="button"
              onClick={handlePhotoButtonClick}
              disabled={!isLoaded || isUploadingPhoto}
              className={actionButtonClassName}
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="!h-4 !w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Camera className="!h-4 !w-4" />
                  Change Photo
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground sm:max-w-[28ch]">
              JPEG, PNG, WebP, or AVIF. Max 5 MB, minimum 128 x 128 pixels.
            </p>
          </div>
        </div>

        {notice ? (
          <Alert
            variant={notice.type === "error" ? "destructive" : "default"}
            className={
              notice.type === "success"
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                : undefined
            }
          >
            <AlertTitle>
              {notice.type === "success" ? "Updated" : "Unable to Save"}
            </AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        ) : null}

        <Separator />

        <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="!h-4 !w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Name</p>
              </div>
              <p className="font-medium">{currentFullName}</p>
              <p className="text-sm text-muted-foreground">
                This appears on your account and project dashboard.
              </p>
            </div>
            <Dialog
              open={nameDialogOpen}
              onOpenChange={handleNameDialogOpenChange}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  disabled={!isLoaded}
                  className={`mt-3 ${actionButtonClassName}`}
                >
                  <PencilLine className="!h-4 !w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Name</DialogTitle>
                  <DialogDescription>
                    Update the name shown on your account and orders.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleNameSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="account-first-name">First name</Label>
                      <Input
                        id="account-first-name"
                        maxLength={MAX_NAME_LENGTH}
                        value={firstName}
                        onChange={(event) => {
                          setFirstName(event.target.value);
                          if (nameError) {
                            setNameError(null);
                          }
                        }}
                        autoComplete="given-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-last-name">Last name</Label>
                      <Input
                        id="account-last-name"
                        maxLength={MAX_NAME_LENGTH}
                        value={lastName}
                        onChange={(event) => {
                          setLastName(event.target.value);
                          if (nameError) {
                            setNameError(null);
                          }
                        }}
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  {nameError ? (
                    <Alert variant="destructive">
                      <AlertTitle>Unable to Save</AlertTitle>
                      <AlertDescription>{nameError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <DialogFooter className="gap-2">
                    <Button
                      type="button"
                      onClick={() => setNameDialogOpen(false)}
                      disabled={isSavingName}
                      className={actionButtonClassName}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSavingName}
                      className={actionButtonClassName}
                    >
                      {isSavingName ? (
                        <>
                          <Loader2 className="!h-4 !w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Name"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Mail className="!h-4 !w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Email</p>
              </div>
              <p className="break-words font-medium">{currentEmail}</p>
              <p className="text-sm text-muted-foreground">
                Delivery updates and order communication are sent here.
              </p>
            </div>
            <Dialog
              open={emailDialogOpen}
              onOpenChange={handleEmailDialogOpenChange}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  disabled={!isLoaded}
                  className={`mt-3 ${actionButtonClassName}`}
                >
                  <PencilLine className="!h-4 !w-4" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-4 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Email</DialogTitle>
                  <DialogDescription>
                    Verify the new address before it becomes your primary email.
                  </DialogDescription>
                </DialogHeader>

                {pendingEmailAddressId ? (
                  <form onSubmit={handleVerifyEmail} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-email-code">
                        Verification code
                      </Label>
                      <Input
                        id="account-email-code"
                        value={verificationCode}
                        onChange={(event) => {
                          setVerificationCode(event.target.value);
                          if (emailError) {
                            setEmailError(null);
                          }
                        }}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="Enter the code from your inbox"
                      />
                      <p className="text-sm text-muted-foreground">
                        We sent a verification code to {newEmail.trim().toLowerCase()}.
                      </p>
                    </div>

                    {emailError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Unable to Verify</AlertTitle>
                        <AlertDescription>{emailError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setPendingEmailAddressId(null);
                          setVerificationCode("");
                          setEmailError(null);
                        }}
                        disabled={isVerifyingEmail}
                        className={actionButtonClassName}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isVerifyingEmail}
                        className={actionButtonClassName}
                      >
                        {isVerifyingEmail ? (
                          <>
                            <Loader2 className="!h-4 !w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          "Verify Email"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <form onSubmit={handleSendVerificationCode} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="account-email-address">New email</Label>
                      <Input
                        id="account-email-address"
                        type="email"
                        maxLength={MAX_EMAIL_LENGTH}
                        value={newEmail}
                        onChange={(event) => {
                          setNewEmail(event.target.value);
                          if (emailError) {
                            setEmailError(null);
                          }
                        }}
                        autoComplete="email"
                        placeholder="name@example.com"
                      />
                    </div>

                    {emailError ? (
                      <Alert variant="destructive">
                        <AlertTitle>Unable to Send Code</AlertTitle>
                        <AlertDescription>{emailError}</AlertDescription>
                      </Alert>
                    ) : null}

                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        onClick={() => setEmailDialogOpen(false)}
                        disabled={isSendingVerificationCode}
                        className={actionButtonClassName}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSendingVerificationCode}
                        className={actionButtonClassName}
                      >
                        {isSendingVerificationCode ? (
                          <>
                            <Loader2 className="!h-4 !w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Send Verification Code"
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getPrimaryEmail(
  user: ReturnType<typeof useUser>["user"],
): string | undefined {
  if (!user) {
    return undefined;
  }

  return user.emailAddresses.find(
    (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
  )?.emailAddress;
}

function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallback: string,
) {
  const firstInitial = firstName?.trim().at(0);
  const lastInitial = lastName?.trim().at(0);
  const initials = `${firstInitial ?? ""}${lastInitial ?? ""}`.trim();

  return initials || fallback;
}

function getFullName(
  fallbackFullName: string,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
) {
  const fullName = [firstName?.trim(), lastName?.trim()]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return fullName || fallbackFullName;
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray(error.errors) &&
    error.errors.length > 0
  ) {
    const firstError = error.errors[0];

    if (
      typeof firstError === "object" &&
      firstError !== null &&
      "longMessage" in firstError &&
      typeof firstError.longMessage === "string" &&
      firstError.longMessage.length > 0
    ) {
      return firstError.longMessage;
    }

    if (
      typeof firstError === "object" &&
      firstError !== null &&
      "message" in firstError &&
      typeof firstError.message === "string" &&
      firstError.message.length > 0
    ) {
      return firstError.message;
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function validateNameFields(firstName: string, lastName: string) {
  if (!firstName && !lastName) {
    return "Enter at least a first name or a last name.";
  }

  const nameError = validateNamePart(firstName) ?? validateNamePart(lastName);

  if (nameError) {
    return nameError;
  }

  return null;
}

function validateNamePart(value: string) {
  if (!value) {
    return null;
  }

  if (value.length > MAX_NAME_LENGTH) {
    return `Names must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  if (/[\p{C}]/u.test(value)) {
    return "Names cannot contain control or non-printing characters.";
  }

  if (!NAME_ALLOWED_CHARACTERS_PATTERN.test(value)) {
    return "Use letters plus spaces, apostrophes, periods, or hyphens only.";
  }

  return null;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function validateEmailAddress(nextEmail: string, currentEmail: string) {
  if (!nextEmail) {
    return "Enter the new email address you want to use.";
  }

  if (nextEmail.length > MAX_EMAIL_LENGTH) {
    return `Email addresses must be ${MAX_EMAIL_LENGTH} characters or fewer.`;
  }

  if (!EMAIL_PATTERN.test(nextEmail)) {
    return "Enter a valid email address.";
  }

  if (nextEmail === currentEmail) {
    return "That email is already your primary account email.";
  }

  return null;
}

function normalizeVerificationCode(value: string) {
  return value.replace(/\s+/g, "");
}

function validateVerificationCode(value: string) {
  if (!value) {
    return "Enter the verification code from your inbox.";
  }

  if (!EMAIL_CODE_PATTERN.test(value)) {
    return "Verification codes must be 6 digits.";
  }

  return null;
}

async function validateProfilePhoto(file: File) {
  if (!PROFILE_IMAGE_MIME_TYPES.has(file.type)) {
    return "Upload a JPEG, PNG, WebP, or AVIF image.";
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "Profile photos must be 5 MB or smaller.";
  }

  const dimensions = await getImageDimensions(file);

  if (!dimensions) {
    return "We could not read that image. Try another file.";
  }

  if (
    dimensions.width < MIN_PROFILE_IMAGE_DIMENSION ||
    dimensions.height < MIN_PROFILE_IMAGE_DIMENSION
  ) {
    return `Profile photos must be at least ${MIN_PROFILE_IMAGE_DIMENSION} x ${MIN_PROFILE_IMAGE_DIMENSION} pixels.`;
  }

  return null;
}

async function getImageDimensions(file: File) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const dimensions = await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();

        image.onload = () => {
          resolve({
            width: image.naturalWidth,
            height: image.naturalHeight,
          });
        };
        image.onerror = () => {
          reject(new Error("Unable to load image"));
        };
        image.src = imageUrl;
      },
    );

    return dimensions;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}
