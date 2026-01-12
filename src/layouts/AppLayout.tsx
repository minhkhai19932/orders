import { Outlet, NavLink } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">
              Shop Admin
            </h1>
            <nav className="flex space-x-1">
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Orders
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-brand text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Products
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;

