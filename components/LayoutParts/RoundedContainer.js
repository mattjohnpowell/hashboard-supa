import React from "react";

export default function RoundedContainer({ children }) {
    return (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8 m-1">
        {children}
        </div>
    );
    }