import type { UseFormReturn } from "react-hook-form";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { SUPPORTED_CHAINS_FOR_FORM } from "@calcom/rainbow/utils/ethereum";
import type { FormValues } from "@calcom/web/pages/event-types/[type]";

import Select from "@components/ui/form/Select";

type RainbowInstallFormProps = {
  formMethods: UseFormReturn<FormValues>;
  blockchainId: number;
  smartContractAddress: string;
};

const RainbowInstallForm: React.FC<RainbowInstallFormProps> = ({
  formMethods,
  blockchainId,
  smartContractAddress,
}) => {
  const { t } = useLocale();

  return (
    <>
      <hr className="my-2 border-neutral-200" />

      <div className="block items-center sm:flex">
        <div className="min-w-48 mb-4 sm:mb-0">
          <label htmlFor="blockchainId" className="flex text-sm font-medium text-neutral-700">
            {t("Blockchain")}
          </label>
        </div>
        <Select
          isSearchable={false}
          className="block w-full min-w-0 flex-1 rounded-sm text-sm"
          onChange={(e) => {
            formMethods.setValue("blockchainId", (e && e.value) || 1);
          }}
          defaultValue={
            SUPPORTED_CHAINS_FOR_FORM.find((e) => e.value === blockchainId) || {
              value: 1,
              label: "Ethereum",
            }
          }
          options={SUPPORTED_CHAINS_FOR_FORM || [{ value: 1, label: "Ethereum" }]}
        />
      </div>
      <div className="block items-center sm:flex">
        <div className="min-w-48 mb-4 sm:mb-0">
          <label htmlFor="smartContractAddress" className="flex text-sm font-medium text-neutral-700">
            {t("token_address")}
          </label>
        </div>
        <div className="w-full">
          <div className="relative mt-1 rounded-sm">
            <input
              type="text"
              className="block w-full rounded-sm border-gray-300 text-sm "
              placeholder={t("Example: 0x71c7656ec7ab88b098defb751b7401b5f6d8976f")}
              defaultValue={(smartContractAddress || "") as string}
              {...formMethods.register("smartContractAddress")}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RainbowInstallForm;
