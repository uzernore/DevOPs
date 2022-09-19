import crypto from "crypto";
import { signOut } from "next-auth/react";
import { useRef, useState, BaseSyntheticEvent } from "react";
import { Controller, useForm } from "react-hook-form";

import { ErrorCode } from "@calcom/lib/auth";
import { WEBSITE_URL } from "@calcom/lib/constants";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import { TRPCClientErrorLike } from "@calcom/trpc/client";
import { trpc } from "@calcom/trpc/react";
import { AppRouter } from "@calcom/trpc/server/routers/_app";
import { Icon } from "@calcom/ui";
import { Alert } from "@calcom/ui/Alert";
import Avatar from "@calcom/ui/v2/core/Avatar";
import { Button } from "@calcom/ui/v2/core/Button";
import { Dialog, DialogContent, DialogTrigger } from "@calcom/ui/v2/core/Dialog";
import ImageUploader from "@calcom/ui/v2/core/ImageUploader";
import Meta from "@calcom/ui/v2/core/Meta";
import { Form, Label, TextField, PasswordField } from "@calcom/ui/v2/core/form/fields";
import { getLayout } from "@calcom/ui/v2/core/layouts/SettingsLayout";
import showToast from "@calcom/ui/v2/core/notifications";
import { SkeletonContainer, SkeletonText, SkeletonButton, SkeletonAvatar } from "@calcom/ui/v2/core/skeleton";

import TwoFactor from "@components/auth/TwoFactor";

const SkeletonLoader = () => {
  return (
    <SkeletonContainer>
      <div className="mt-6 mb-8 space-y-6 divide-y">
        <div className="flex items-center">
          <SkeletonAvatar className=" h-12 w-12 px-4" />
          <SkeletonButton className=" h-6 w-32 rounded-md p-5" />
        </div>
        <SkeletonText className="h-8 w-full" />
        <SkeletonText className="h-8 w-full" />
        <SkeletonText className="h-8 w-full" />

        <SkeletonButton className="mr-6 h-8 w-20 rounded-md p-5" />
      </div>
    </SkeletonContainer>
  );
};

interface DeleteAccountValues {
  totpCode: string;
}

const ProfileView = () => {
  const { t } = useLocale();
  const utils = trpc.useContext();

  const { data: user, isLoading } = trpc.useQuery(["viewer.me"]);
  const mutation = trpc.useMutation("viewer.updateProfile", {
    onSuccess: () => {
      showToast(t("settings_updated_successfully"), "success");
    },
    onError: () => {
      showToast(t("error_updating_settings"), "error");
    },
  });

  const [confirmPasswordOpen, setConfirmPasswordOpen] = useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordDeleteErrorMessage] = useState("");
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [hasDeleteErrors, setHasDeleteErrors] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState("");

  const form = useForm<DeleteAccountValues>();

  const emailMd5 = crypto
    .createHash("md5")
    .update(user?.email || "example@example.com")
    .digest("hex");

  const onDeleteMeSuccessMutation = async () => {
    await utils.invalidateQueries(["viewer.me"]);
    showToast(t("Your account was deleted"), "success");

    setHasDeleteErrors(false); // dismiss any open errors
    if (process.env.NEXT_PUBLIC_WEBAPP_URL === "https://app.cal.com") {
      signOut({ callbackUrl: "/auth/logout?survey=true" });
    } else {
      signOut({ callbackUrl: "/auth/logout" });
    }
  };

  const confirmPasswordMutation = trpc.useMutation("viewer.auth.verifyPassword", {
    onSuccess() {
      mutation.mutate(formMethods.getValues());
      setConfirmPasswordOpen(false);
    },
    onError() {
      setConfirmPasswordDeleteErrorMessage(t("incorrect_password"));
    },
  });

  const onDeleteMeErrorMutation = (error: TRPCClientErrorLike<AppRouter>) => {
    setHasDeleteErrors(true);
    setDeleteErrorMessage(errorMessages[error.message]);
  };
  const deleteMeMutation = trpc.useMutation("viewer.deleteMe", {
    onSuccess: onDeleteMeSuccessMutation,
    onError: onDeleteMeErrorMutation,
    async onSettled() {
      await utils.invalidateQueries(["viewer.me"]);
    },
  });

  const onConfirmPassword = (e: Event | React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    const password = passwordRef.current.value;
    confirmPasswordMutation.mutate({ passwordInput: password });
  };

  const onConfirmButton = (e: Event | React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    const totpCode = form.getValues("totpCode");
    const password = passwordRef.current.value;
    deleteMeMutation.mutate({ password, totpCode });
  };
  const onConfirm = ({ totpCode }: DeleteAccountValues, e: BaseSyntheticEvent | undefined) => {
    e?.preventDefault();
    const password = passwordRef.current.value;
    deleteMeMutation.mutate({ password, totpCode });
  };

  const formMethods = useForm({
    defaultValues: {
      avatar: user?.avatar || "",
      username: user?.username || "",
      name: user?.name || "",
      email: user?.email || "",
      bio: user?.bio || "",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const passwordRef = useRef<HTMLInputElement>(null!);

  const errorMessages: { [key: string]: string } = {
    [ErrorCode.SecondFactorRequired]: t("2fa_enabled_instructions"),
    [ErrorCode.IncorrectPassword]: `${t("incorrect_password")} ${t("please_try_again")}`,
    [ErrorCode.UserNotFound]: t("no_account_exists"),
    [ErrorCode.IncorrectTwoFactorCode]: `${t("incorrect_2fa_code")} ${t("please_try_again")}`,
    [ErrorCode.InternalServerError]: `${t("something_went_wrong")} ${t("please_try_again_and_contact_us")}`,
    [ErrorCode.ThirdPartyIdentityProviderEnabled]: t("account_created_with_identity_provider"),
  };

  if (isLoading) return <SkeletonLoader />;

  return (
    <>
      <Form
        form={formMethods}
        handleSubmit={(values) => {
          if (values.email !== user?.email) {
            setConfirmPasswordOpen(true);
          } else {
            mutation.mutate(values);
          }
        }}>
        <Meta title="Profile" description="Manage settings for your cal profile" />
        <div className="flex items-center">
          <Controller
            control={formMethods.control}
            name="avatar"
            render={({ field: { value } }) => (
              <>
                <Avatar alt="" imageSrc={value} gravatarFallbackMd5={emailMd5} size="lg" />
                <div className="ml-4">
                  <ImageUploader
                    target="avatar"
                    id="avatar-upload"
                    buttonMsg={t("change_avatar")}
                    handleAvatarChange={(newAvatar) => {
                      formMethods.setValue("avatar", newAvatar);
                    }}
                    imageSrc={value}
                  />
                </div>
              </>
            )}
          />
        </div>
        <div className="mt-8">
          <TextField
            data-testid="username-input"
            label={t("personal_cal_url")}
            addOnLeading={WEBSITE_URL + "/"}
            {...formMethods.register("username")}
          />
        </div>
        <div className="mt-8">
          <TextField label={t("full_name")} {...formMethods.register("name")} />
        </div>
        <div className="mt-8">
          <TextField label={t("email")} hint={t("change_email_hint")} {...formMethods.register("email")} />
        </div>
        <div className="mt-8">
          <TextField label={t("about")} hint={t("bio_hint")} {...formMethods.register("bio")} />
        </div>

        <Button color="primary" className="mt-8" type="submit" loading={mutation.isLoading}>
          {t("update")}
        </Button>

        <hr className="my-6  border-neutral-200" />

        <Label>{t("danger_zone")}</Label>
        {/* Delete account Dialog */}
        <Dialog open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen}>
          <DialogTrigger asChild>
            <Button
              data-testid="delete-account"
              color="destructive"
              className="mt-1 border-2"
              StartIcon={Icon.FiTrash2}>
              {t("delete_account")}
            </Button>
          </DialogTrigger>
          <DialogContent
            title={t("delete_account_modal_title")}
            description={t("confirm_delete_account_modal")}
            type="creation"
            actionText={t("delete_my_account")}
            actionProps={{
              // @ts-expect-error data attributes aren't typed
              "data-testid": "delete-account-confirm",
            }}
            Icon={Icon.FiAlertTriangle}
            actionOnClick={(e) => e && onConfirmButton(e)}>
            <>
              <p className="mb-7">{t("delete_account_confirmation_message")}</p>
              <PasswordField
                data-testid="password"
                name="password"
                id="password"
                type="password"
                autoComplete="current-password"
                required
                label="Password"
                ref={passwordRef}
              />

              {user?.twoFactorEnabled && (
                <Form handleSubmit={onConfirm} className="pb-4" form={form}>
                  <TwoFactor center={false} />
                </Form>
              )}

              {hasDeleteErrors && <Alert severity="error" title={deleteErrorMessage} />}
            </>
          </DialogContent>
        </Dialog>
      </Form>

      {/* If changing email, confirm password */}
      <Dialog open={confirmPasswordOpen} onOpenChange={setConfirmPasswordOpen}>
        <DialogContent
          title={t("confirm_password")}
          description={t("confirm_password_change_email")}
          type="creation"
          actionText={t("confirm")}
          Icon={Icon.FiAlertTriangle}
          actionOnClick={(e) => e && onConfirmPassword(e)}>
          <>
            <PasswordField
              data-testid="password"
              name="password"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              label="Password"
              ref={passwordRef}
            />

            {confirmPasswordErrorMessage && <Alert severity="error" title={confirmPasswordErrorMessage} />}
          </>
        </DialogContent>
      </Dialog>
    </>
  );
};

ProfileView.getLayout = getLayout;

export default ProfileView;
