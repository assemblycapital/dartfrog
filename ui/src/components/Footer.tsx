
const DisplayUserActivity = () => {
  return (
    <div
      style={{
      display: "flex",
      flexDirection: "column",
      gap: "0.8rem",
      }}
      >
      <div
        style={{
          fontSize: "0.8rem",
          color: "#ffffff44",
          cursor: "default",
          display: "flex",
          flexDirection: "row",
          gap: "1rem",
        }}
      >
      <div
        style={{
          display: "inline-block",
          alignContent: "flex-end",
        }}
      >
        <svg style={{
            width: "32",
            height: "32",
            fill: "none",
            opacity: "0.2",
          }}
          viewBox="0 0 388 194"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M194 0H97V97H0V194H97V97H194H291V194H388V97H291V0H194Z" fill="white" />
        </svg>
      </div>

        <span
          style={{
            alignContent: "center",
          }}
        >
          For help, contact a.cow on Discord.
          If you're having trouble, you may need to update your app version.
        </span>
      </div>
    </div>

  );
}
export default DisplayUserActivity;