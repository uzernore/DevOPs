import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Icon } from "@calcom/ui";
import Badge from "@calcom/ui/v2/core/Badge";
import Button from "@calcom/ui/v2/core/Button";
import ButtonGroup from "@calcom/ui/v2/core/ButtonGroup";

type Props = {
  required?: boolean;
  question?: string;
  type?: string;
  editOnClick: () => void;
  deleteOnClick: () => void;
};

function CustomInputItem({ required, deleteOnClick, editOnClick, type, question }: Props) {
  const { t } = useLocale();
  return (
    <li className="border-1 flex border border-gray-200 bg-white px-6 py-4 first:rounded-t-md last:rounded-b-md only:rounded-md  xl:ml-7 ">
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="pr-2 text-sm font-semibold leading-none text-black">{question}</span>
          <Badge variant="default" color="gray">
            {required ? t("required") : t("optional")}
          </Badge>
        </div>
        <p className="text-sm leading-normal text-gray-600">{type}</p>
      </div>
      <ButtonGroup containerProps={{ className: "ml-auto" }}>
        <Button color="secondary" onClick={editOnClick}>
          {t("edit")}
        </Button>
        <Button
          StartIcon={Icon.FiTrash}
          size="icon"
          color="destructive"
          onClick={deleteOnClick}
          className="border border-gray-200"
        />
      </ButtonGroup>
    </li>
  );
}

export default CustomInputItem;
