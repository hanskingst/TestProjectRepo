import { Outlet } from "react-router";

function App() {
  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Outlet />
      </div>
    </>
  );
}

export default App;
