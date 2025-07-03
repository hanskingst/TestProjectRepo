import weartherImage from "../assets/weatherImage.jpg";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const WelcomeScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => navigate("/signUpScreen"), 5000);
  }, [navigate]);

  return (
    <div
      className="min-h-screen 
    w-full bg-gradient-to-b 
    from-blue-600 
    to-blue-300 flex 
    justify-center items-center flex-col "
    >
      <div className="mb-3">
        <img
          src={weartherImage}
          alt="JohnyWeather image"
          className="w-40 h-auto rounded-full shadow-xl border-2 border-blue-50 animate-zoom-in"
        />
      </div>
      <div className="text-center flex flex-col items-center">
        <h1 className="text-sm md:text-xl lg:text-3xl font-bold text-blue-50 animate-fade-in">
          Welcome to your weather tracking app
        </h1>
        <p className="text-gray-100 text-lg mt-1 mb-1 animate-fade-in">
          Don't be supprised by the weather of where you are
        </p>
        <div className="flex items-center">
          <div className="w-48 rounded-full h-3 shadow-xl border-2 border-white bg-gray-100 overflow-hidden">
            <div className="bg-blue-700 animate-progress h-full "></div>
          </div>
          <span className="ml-3 text-gray-300 text-sm">Redirecting...</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
