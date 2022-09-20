import { useState } from "react";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import * as Yup from "yup";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Formik, Form } from "formik";
import Input from "@/components/Input";

import MySelect from "@/components/MySelect";

const CEXAPISchema = Yup.object().shape({
  exchange: Yup.string()
    .trim()
    .matches(/^(FTX|Binance|Coinbase|CoinbasePro)$/),
  apikey: Yup.string().trim().required(),
  secretkey: Yup.string().trim().required(),
});

const CEXAPIForm = ({
  initialValues = null,
  redirectPath = "",
  buttonText = "Submit",
  onSubmit = () => null,
}) => {
  const router = useRouter();

  const [disabled, setDisabled] = useState(false);

  const handleOnSubmit = async (values = null) => {
    let toastId;
    try {
      setDisabled(true);
      toastId = toast.loading("Submitting...");
      // Submit data
      if (typeof onSubmit === "function") {
        await onSubmit({ ...values });
      }
      toast.success("Successfully submitted", { id: toastId });
      setDisabled(false);

      // Redirect user
      if (redirectPath) {
        router.push(redirectPath);
      }
    } catch (e) {
      toast.error("Unable to submit", { id: toastId });
      setDisabled(false);
    }
  };

  //handle selection state and update a state to enable/disable an input box
  const [selectionState, setSelectionState] = useState("");
  const handleSelectionChange = (e) => {
    setSelectionState(e.target.value);
  };

  const { ...initialFormValues } = initialValues ?? {
    exchange: "FTX",
    apikey: "",
    secretkey: "",
    passphrase: "",
    uid: "",
    nickname: "",
    subaccount: "",
  };
  const exchanges = [
    { name: "FTX" },
    { name: "Binance" },
    { name: "Coinbase" },
    { name: "CoinbasePro" },
  ];

  return (
    <div>
      <div className="mb-8 max-w-md"></div>
      <Formik
        initialValues={initialFormValues}
        validationSchema={CEXAPISchema}
        validateOnBlur={false}
        onSubmit={handleOnSubmit}
      >
        {({ isSubmitting, isValid }) => (
          <Form className="space-y-8">
            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="flex flex-col space-y-1">
                  <MySelect
                    label="Exchange"
                    name="exchange"
                    onClick={handleSelectionChange}
                  >
                    {exchanges.map((exchange) => (
                      <option value={exchange.name} key={exchange.name}>
                        {exchange.name}
                      </option>
                    ))}
                  </MySelect>
                </div>
                <Input
                  label="Nickname"
                  name="nickname"
                  type="text"
                  placeholder="Enter Nickname"
                  disabled={disabled}
                />
                <Input
                  label="Subaccount"
                  name="subaccount"
                  type="text"
                  placeholder="Enter Subaccount"
                  disabled={disabled}
                />
                <Input
                  name="apikey"
                  type="text"
                  label="API Key"
                  placeholder="apikey"
                  disabled={disabled}
                />
                <Input
                  name="secretkey"
                  type="text"
                  label="Secret Key"
                  placeholder="secretkey"
                  disabled={disabled}
                />
                <Input
                  name="passphrase"
                  type="text"

                  label={selectionState === "CoinbasePro" ? "Passphrase" : ""}
                  placeholder="passphrase"
                  hidden={selectionState === "CoinbasePro" ? false : true}
                  disabled={disabled}
                />
                <Input
                  name="uid"
                  type="text"

                  label={selectionState === ("Huobi") ? "uid" : ""}
                  placeholder="uid"
                  hidden={selectionState === ("Huobi") ? false : true}
                  disabled={disabled}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={disabled || !isValid}
                className="bg-rose-600 text-white py-2 px-6 rounded-md focus:outline-none focus:ring-4 focus:ring-rose-600 focus:ring-opacity-50 hover:bg-rose-500 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
              >
                {isSubmitting ? "Submitting..." : buttonText}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

CEXAPIForm.propTypes = {
  initialValues: PropTypes.shape({
    exchange: PropTypes.string,
    apikey: PropTypes.string,
    secretkey: PropTypes.string,
    passphrase: PropTypes.string,
    uid: PropTypes.string,
    nickname: PropTypes.string,
    subaccount: PropTypes.string,
  }),
  redirectPath: PropTypes.string,
  buttonText: PropTypes.string,
  onSubmit: PropTypes.func,
};

export default CEXAPIForm;
