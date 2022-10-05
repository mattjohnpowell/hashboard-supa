const DashPanel = ({ children }) => {
    return (
        <div className="grid grid-cols-4 gap-4 bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8 m-1">
        {children}
        </div>
    )

}
export default DashPanel