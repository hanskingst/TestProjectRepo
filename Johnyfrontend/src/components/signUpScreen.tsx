import { useFormHook } from "../hooks/useFormHook";
import { z } from "zod";
import { signupSChema } from "../schema/signupSchema";
import axios from "axios";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router";
import weatherImage from "../assets/weatherImage.jpg";

const SignUpScreen = () => {
  type signUpFormData = z.infer<typeof signupSChema>;

  const signUpUser = async (data: signUpFormData) => {
    const result = await axios.post("http://localhost:8000/signup", data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return result.data;
  };

  const {
    handleSubmit,
    register,
    errors,
    isApiError,
    isPending,
    isSuccess,
    mutationError,
  } = useFormHook(signupSChema, signUpUser);

  const navigate = useNavigate();

  useEffect(() => {
    if (isSuccess) {
      navigate("/loginScreen");
    }
  }, [navigate, isSuccess]);

  return (
    <div className="min-h-screen  bg-gray-100 flex flex-col justify-center items-center">
      <img
        src={weatherImage}
        alt="Johnyweather image"
        className="rounded-full mb-4 w-18 border border-white animate-zoom-in animate-fade-in"
      />
      <div className="text-center rounded-xl shadow-lg bg-blue-50 p-8 max-w-md">
        <h1 className="font-bold mb-4 text-sm md:text-lg lg:text-xl text-gray-700">
          Sign Up
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
              {...register("user_name")}
              className="block w-full p-1 rounded-lg text border border-gray-300 outline-none mt-1"
            />
            {errors.user_name && (
              <p className="text-red-400 text-sm mt-1 ">
                {errors.user_name?.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="useremail"
              className="block text-left text-gray-700 text-sm font-medium"
            >
              User Email:
            </label>
            <input
              type="email"
              id="useremail"
              {...register("user_email")}
              className="block w-full p-1 rounded-lg text border border-gray-300 outline-none mt-1"
            />
            {errors.user_email && (
              <p className="text-red-400 text-sm mt-1">
                {errors.user_email?.message}
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
              {...register("user_password")}
              className="block w-full p-1 rounded-lg text border border-gray-300 outline-none mt-1"
            />
            {errors.user_password && (
              <p className="text-red-400 text-sm mt-1">
                {errors.user_password?.message}
              </p>
            )}
          </div>
          {isApiError && mutationError && (
            <p className="text-red-600 text-sm">
              Error:{mutationError?.message || "Sign up failed"}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-lg text-center font-medium text-white"
          >
            {isPending ? "Signin up..." : "Sign Up"}
          </button>
          <Link className="text-sm text-blue-500" to="/loginScreen">
            Already have an account?? sign in
          </Link>
        </form>
      </div>
    </div>
  );
};

export default SignUpScreen;
