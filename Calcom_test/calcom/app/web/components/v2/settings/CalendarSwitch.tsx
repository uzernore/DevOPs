import { useMutation } from "react-query";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { trpc } from "@calcom/trpc/react";
import { Icon } from "@calcom/ui";
import Badge from "@calcom/ui/v2/core/Badge";
import Switch from "@calcom/ui/v2/core/Switch";
import showToast from "@calcom/ui/v2/core/notifications";

export function CalendarSwitch(props: {
  type: string;
  externalId: string;
  title: string;
  defaultSelected: boolean;
  isSelected: boolean;
}) {
  const { t } = useLocale();

  const utils = trpc.useContext();

  const mutation = useMutation<
    unknown,
    unknown,
    {
      isOn: boolean;
    }
  >(
    async ({ isOn }) => {
      const body = {
        integration: props.type,
        externalId: props.externalId,
      };
      if (isOn) {
        const res = await fetch("/api/availability/calendar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          throw new Error("Something went wrong");
        }
      } else {
        const res = await fetch("/api/availability/calendar", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error("Something went wrong");
        }
      }
    },
    {
      async onSettled() {
        await utils.invalidateQueries(["viewer.integrations"]);
      },
      onError() {
        showToast(`Something went wrong when toggling "${props.title}""`, "error");
      },
    }
  );
  return (
    <div className="flex space-x-2 py-1">
      <Switch
        key={props.externalId}
        name="enabled"
        label={props.title}
        defaultChecked={props.isSelected}
        onCheckedChange={(isOn: boolean) => {
          mutation.mutate({ isOn });
        }}
      />
      {props.defaultSelected && (
        <Badge variant="gray">
          <Icon.FiArrowLeft className="mr-1" /> {t("adding_events_to")}
        </Badge>
      )}
    </div>
  );
}
