import { useState } from "react";
import { useLogginStore } from "../Store/useLoginStore";
import { useUpdateProfileStore } from "../Store/useUpdateProfileStore";
import { Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FiSearch } from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WeatherData {
  current: {
    name: string;
    main: { temp: number; humidity: number };
    weather: Array<{ description: string; icon: string }>;
    wind: { speed: number };
  };
  forecast: {
    list: Array<{
      dt: number;
      main: { temp: number; humidity: number };
      wind: { speed: number };
    }>;
  };
}

interface Notification {
  notification_id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  location: string;
  created_at: string;
}

interface DailyWeather {
  date: string;
  temp: number;
  humidity: number;
  wind: number;
}

const Dashboard = () => {
  const { user_name, user_location } = useUpdateProfileStore();
  const { clearTokens, access_token } = useLogginStore();
  const [issidebarOpen, setIssidebarOpen] = useState(false);
  const [searchWord, setSearchword] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const toggleSidebar = () => {
    setIssidebarOpen(!issidebarOpen);
  };

  const handleLogout = () => {
    clearTokens();
    navigate("/loginScreen");
  };

  const fetchWeatherData = async (): Promise<WeatherData> => {
    if (!user_location) throw new Error("No location set");
    const current = await axios.get("http://localhost:8000/weather/current", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    console.log("Current weather location:", current.data.name); // Debug
    const forecast = await axios.get("http://localhost:8000/weather/forecast", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return { current: current.data, forecast: forecast.data };
  };

  const {
    data: weatherData,
    error: weatherError,
    isLoading: weatherLoading,
  } = useQuery<WeatherData, Error>({
    queryKey: ["weather", user_location],
    queryFn: fetchWeatherData,
    enabled: !!user_location,
  });

  const fetchNotifications = async (): Promise<Notification[]> => {
    const result = await axios.get("http://localhost:8000/notifications", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return result.data;
  };

  const {
    data: notifications,
    error: notifError,
    isLoading: notifLoading,
  } = useQuery<Notification[], Error>({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 60000,
  });

  const markNotificationsRead = useMutation({
    mutationFn: async () => {
      return await axios.patch(
        "http://localhost:8000/notifread",
        {},
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );
    },
  });

  const fetchNotificationCount = async (): Promise<number> => {
    const result = await axios.get("http://localhost:8000/notificount", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    return result.data.unread_notification_count;
  };

  const { data: notifCount } = useQuery<number, Error>({
    queryKey: ["notificationCount"],
    queryFn: fetchNotificationCount,
  });

  const handleWeatherSearch = async () => {
    if (!searchWord) return;
    try {
      const response = await axios.get(
        `http://localhost:8000/weather/city?q=${searchWord}`
      );
      const { coord, name } = response.data;
      console.log("City search response:", name, coord);
      const userId = useUpdateProfileStore.getState().user_id;
      if (!userId) {
        console.error("User ID is not available");
        return;
      }
      await axios.patch(
        `http://localhost:8000/users/${userId}/location`,
        { lat: coord.lat, lon: coord.lon },
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      await useUpdateProfileStore
        .getState()
        .setUProfile(
          userId,
          user_name || "",
          useUpdateProfileStore.getState().user_email || "",
          `lat:${coord.lat},lon:${coord.lon}`
        );
      queryClient.invalidateQueries({ queryKey: ["weather"] }); // Force refetch
      setSearchword("");
    } catch (err) {
      console.error("City search failed:", err);
    }
  };

  const getDailyWeather = (): DailyWeather[] => {
    if (!weatherData?.forecast) return [];
    const daily: DailyWeather[] = [];
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const yesterdayData =
      weatherData.forecast.list.find(
        (item: WeatherData["forecast"]["list"][0]) => {
          return new Date(item.dt * 1000).getDate() === yesterday.getDate();
        }
      ) || weatherData.forecast.list[0];
    daily.push({
      date: "Yesterday",
      temp: yesterdayData.main.temp,
      humidity: yesterdayData.main.humidity,
      wind: yesterdayData.wind.speed,
    });

    const dailyForecast = weatherData.forecast.list.reduce(
      (acc: DailyWeather[], item: WeatherData["forecast"]["list"][0]) => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        if (
          date.getDate() >= today.getDate() &&
          !acc.some((d: DailyWeather) => d.date === dateStr)
        ) {
          acc.push({
            date: dateStr,
            temp: item.main.temp,
            humidity: item.main.humidity,
            wind: item.wind.speed,
          });
        }
        return acc;
      },
      []
    );
    return [...daily, ...dailyForecast.slice(0, 6)];
  };

  const dailyWeather = getDailyWeather();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-700 to-blue-300">
      <nav className="h-16 flex justify-between w-full lg:mx-auto bg-blue-900 shadow-xl">
        <h1 className="text-white m-1 text-sm font-bold lg:text-lg">
          {user_name || user_location ? `Welcome ${user_name}` : "Welcome User"}
        </h1>
        <button
          className="md:hidden rounded hover:bg-blue-600 bg-blue-700 text-white focus:outline-none p-2"
          onClick={toggleSidebar}
        >
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </nav>

      <div className="flex flex-1 relative overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 w-64 bg-blue-950 p-2 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
            issidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:ml-auto`}
        >
          <p className="font-bold text-lg text-white">JohnyWeather</p>
          <ul className="text-white text-center p-8 font-medium mt-4 space-y-2">
            <li className="p-2 hover:bg-gray-400 transform transition-colors duration-300 ease-out w-full rounded-xl focus:bg-gray-400">
              <Link to="/dashboard" onClick={() => setIssidebarOpen(false)}>
                Dashboard
              </Link>
            </li>
            <li className="p-2 hover:bg-gray-400 transform transition-colors duration-300 ease-out w-full rounded-xl focus:bg-gray-400 relative">
              <Link to="/dashboard" onClick={() => setIssidebarOpen(false)}>
                Notification
              </Link>
              <div
                className={`w-5 h-5 text-white text-sm rounded-full bg-red-400 absolute top-0 right-2 ${
                  notifCount ? "block" : "hidden"
                }`}
              >
                {notifCount || ""}
              </div>
            </li>
            <li className="p-2 hover:bg-red-500 w-full rounded-xl transform transition-colors duration-300 ease-out focus:bg-red-500">
              <button
                onClick={() => {
                  handleLogout();
                  setIssidebarOpen(false);
                }}
              >
                Logout
              </button>
            </li>
          </ul>
        </aside>

        <main className="flex flex-1 flex-col space-y-4 p-4 lg:p-8">
          <div className="w-full max-w-md mx-auto rounded-2xl mt-1 flex items-center border-white border-2 h-10 gap-0.5">
            <input
              placeholder="Search weather..."
              type="text"
              value={searchWord}
              onChange={(e) => setSearchword(e.target.value)}
              className="text-white w-full focus:outline-none p-2 bg-transparent"
            />
            <FiSearch
              onClick={handleWeatherSearch}
              className="text-gray-400 mr-2 text-xl cursor-pointer"
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <div className="bg-blue-800 text-white rounded-xl p-4 shadow-lg w-full lg:w-2/3">
              {weatherLoading ? (
                <p>Loading weather...</p>
              ) : weatherError ? (
                <p className="text-red-400">
                  Error loading weather: {weatherError.message}
                </p>
              ) : weatherData ? (
                <>
                  <h3 className="text-lg font-bold">
                    {weatherData.current.name}
                  </h3>
                  <p className="text-sm">Current Weather</p>
                  <p className="text-3xl">{weatherData.current.main.temp}°C</p>
                  <div className="flex justify-between">
                    <p>{weatherData.current.weather[0].description}</p>
                    <p>Humidity: {weatherData.current.main.humidity}%</p>
                    <p>Wind Speed: {weatherData.current.wind.speed} m/s</p>
                    <img
                      src={`https://openweathermap.org/img/wn/${weatherData.current.weather[0].icon}.png`}
                      alt="Weather icon"
                      className="inline-block w-8 h-8 mt-2"
                    />
                  </div>
                </>
              ) : (
                <p>No weather data available</p>
              )}
            </div>

            <div className="bg-blue-800 text-white rounded-xl p-4 shadow-lg w-full lg:w-1/3 max-h-64 overflow-y-auto">
              <h3 className="text-lg font-bold">Notifications</h3>
              {notifLoading ? (
                <p>Loading notifications...</p>
              ) : notifError ? (
                <p className="text-red-400">
                  Error loading notifications: {notifError.message}
                </p>
              ) : notifications && notifications.length > 0 ? (
                <>
                  <ul className="space-y-2">
                    {notifications.map((notif: Notification) => (
                      <li
                        key={notif.notification_id}
                        className="text-sm flex justify-between items-center"
                      >
                        <span>
                          {notif.message} {notif.is_read ? "(Read)" : ""}
                        </span>
                        {!notif.is_read && (
                          <button
                            onClick={() => markNotificationsRead.mutate()}
                            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                          >
                            Mark Read
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => markNotificationsRead.mutate()}
                    className="mt-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded w-full"
                    disabled={markNotificationsRead.isPending}
                  >
                    {markNotificationsRead.isPending
                      ? "Marking..."
                      : "Mark All as Read"}
                  </button>
                </>
              ) : (
                <p>No notifications</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {dailyWeather.map((day: DailyWeather, index: number) => (
              <div
                key={index}
                className="bg-blue-800 text-white rounded-xl p-4 shadow-lg text-center"
              >
                <p className="text-sm font-bold">{day.date}</p>
                <p>{day.temp}°C</p>
                <p className="text-xs">Humidity: {day.humidity}%</p>
                <p className="text-xs">Wind: {day.wind} m/s</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-800 text-white rounded-xl p-4 shadow-lg">
            <h3 className="text-lg font-bold">Temperature Forecast</h3>
            {weatherLoading ? (
              <p>Loading chart...</p>
            ) : weatherError ? (
              <p className="text-red-400">Error loading chart</p>
            ) : dailyWeather.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyWeather}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis dataKey="date" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p>No forecast data available</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
