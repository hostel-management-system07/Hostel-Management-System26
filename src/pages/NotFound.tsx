import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-blue-600">You</h1>
        <h2 className="text-2xl font-semibold text-gray-800">
          Are Logged in Successfully
        </h2>
        <div className="pt-4">
          <Button asChild>
            <Link to="/">Lets go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

