import React from "react";


export default function RoundedContainerSingleFigure({ children, title, className = '' }) {
  return (
    <div className={`${className} flex flex-col bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8 m-1  `}>
      <div className={`${className} font-bold`}>{title}</div>
      <div className={`${className} text-lg font-bold`}>
        {children}
        </div>
    </div>
  );
}
