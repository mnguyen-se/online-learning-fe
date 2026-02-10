import { Search } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Outlet, useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  return (
    <>
      <header className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white text-xl">
              日
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Học Tiếng Nhật Để Đi Làm
            </h1>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl mx-8 relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              placeholder="Tìm kiếm khóa học, bài viết, video..."
              className="pl-10 bg-gray-50 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              className="border bg-white text-gray-900 hover:bg-gray-200"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </Button>

            <Button
              className="bg-linear-to-r from-orange-500 to-red-600 text-white"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </Button>
          </div>

        </div>
      </header>

      <Outlet />
    </>
  );
}
