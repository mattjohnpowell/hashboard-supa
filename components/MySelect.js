import React from "react";
import ReactDOM from "react-dom";
import { Formik, Form, useField } from "formik";
import * as Yup from "yup";
import classNames from "classnames";

const MySelect = ({ label, hidden=false, ...props }) => {
  const [field, meta] = useField(props);
  const error = meta?.touched && meta?.error;
  return (
    <div className="flex flex-col space-y-1">
      {label ? <label hidden={hidden} htmlFor={props.id || props.name}>{label}</label> : null}
      <select
        {...field}
        {...props}
        className={classNames(
          "w-full shadow-sm rounded-md py-2 pl-4 truncate border focus:outline-none focus:ring-4 focus:ring-opacity-20 transition disabled:opacity-50 disabled:cursor-not-allowed",
          error
            ? "border-red-400 text-red-800 focus:border-red-400 focus:ring-red-400"
            : "border-gray-300 focus:border-gray-400 focus:ring-gray-400"
        )}
      />
      {error ? (
        <div className="error">{meta.error}</div>
      ) : null}
    </div>
  );
};

export default MySelect;
