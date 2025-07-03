import { useFormHook } from "../hooks/useFormHook";
import weatherImage from "../assets/weatherImage.jpg";
import { z } from "zod";
import axios from "axios";
import { useCallback } from "react";
import { useLogginStore } from "../Store/useLoginStore";
import { useProfileStore } from "../Store/useProfileStore";
import { logginSchema } from "../schema/logginSchema";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useUpdateProfileStore } from "../Store/useUpdateProfileStore";

const LoginScreen = () => {
  type LogginFormData = z.infer<typeof logginSchema>;
  const { setTokens, access_token } = useLogginStore();
  const { setProfile } = useProfileStore();
  const { setUProfile } = useUpdateProfileStore();
  const [LocationError, setLocationError] = useState<string | null>(null);

  const LoginUser = async (data: LogginFormData) => {
    const formBody = new URLSearchParams(data).toString();
    const response = await axios.post("http://localhost:8000/login", formBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const access_token = response.data.access_token;
    const token_type = response.data.token_type;
    setTokens(access_token, token_type);
  };

  const getCurrentUser = useCallback(async () => {
    const response = await axios.get("http://localhost:8000/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const user_id = response.data.user_id;
    const user_name = response.data.user_name;
    const user_email = response.data.user_email;
    console.log(user_id, " ", user_name, " ", user_email);
    setProfile(user_id, user_name, user_email);
    return user_id;
  }, [setProfile, access_token]);

  const updateLocation = useCallback(
    async (userId: number) => {
      if (!userId) {
        setLocationError("User ID not available. Please try again.");
        return;
      }
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              await axios.patch(
                `http://localhost:8000/users/${userId}/location`,
                { lat: latitude, lon: longitude },
                {
                  headers: {
                    Authorization: `Bearer ${access_token}`,
                  },
                }
              );
            } catch (err) {
              setLocationError(
                "Failed to update location. Please enter a city manually."
              );
              console.error("Location update failed:", err);
            }
          },
          (err) => {
            setLocationError(
              "Location access denied. Please enter a city manually."
            );
            console.error("Geolocation error:", err);
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        setLocationError("Geolocation not supported by your browser.");
      }
    },
    [access_token]
  );

  const getUpdatecurrentUser = useCallback(async () => {
    const response = await axios.get("http://localhost:8000/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    const user_id = response.data.user_id;
    const user_name = response.data.user_name;
    const user_email = response.data.user_email;
    const user_location = response.data.location;
    console.log(user_id, " ", user_name, " ", user_email, " ", user_location);
    setUProfile(user_id, user_name, user_email, user_location);
  }, [access_token, setUProfile]);

  const {
    register,
    handleSubmit,
    errors,
    isApiError,
    isSuccess,
    isPending,
    mutationError,
  } = useFormHook(logginSchema, LoginUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess) {
      navigate("/dashboard");
      getCurrentUser()
        .then((userid) => {
          updateLocation(userid);
          getUpdatecurrentUser();
        })
        .catch((err) => {
          setLocationError("failed to fetch user data please try again");
          console.log("faillure error: ", err);
          navigate("/dashboard");
        });
    }
  }, [
    navigate,
    isSuccess,
    getCurrentUser,
    updateLocation,
    getUpdatecurrentUser,
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <img
        src={weatherImage}
        alt="Johnyweather image"
        className="rounded-full mb-4 w-18 border border-white animate-zoom-in animate-fade-in"
      />
      <div className="text-center max-w-md rounded-xl shadow-lg bg-blue-50 p-8 ">
        <h1 className="font-bold text-sm md:text-lg lg:text-xl text-gray-700">
          Sign In
        </h1>
        <form className="space-y-4" onSubmit={(data) => handleSubmit(data)}>
          <div>
            <label
              htmlFor="username"
              className="block text-left text-gray-700 text-sm font-medium"
            >
              User Name:
            </label>
            <input
              type="text"
              id="username"
              {...register("username")}
              className="block w-full p-1 rounded-lg text border border-gray-300 outline-none mt-1"
            />
            {errors.username && (
              <p className="text-red-400 text-sm mt-1 ">
                {errors.username?.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="userpassword"
              className="block text-left text-gray-700 text-sm font-medium"
            >
              User Password:
            </label>
            <input
              type="password"
              id="userpassword"
              {...register("password")}
              className="block w-full p-1 rounded-lg text border border-gray-300 outline-none mt-1"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.password?.message}
              </p>
            )}
          </div>
          {(isApiError || LocationError) && mutationError && (
            <p className="text-red-600 text-sm">
              Error:
              {mutationError?.message ||
                `Sign In failed for user in ${LocationError}`}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-center font-medium text-white"
            >
              {isPending ? "Signin In..." : "Sign In"}
            </button>
            <Link className="text-sm text-blue-500" to="/signUpScreen">
              Don't have account?? sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
