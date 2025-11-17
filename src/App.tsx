import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Login from "./pages/LoginPage/Login";
import Home from "./pages/HomePage/Home";
import Register from "./pages/RegisterPage/Register";
import Profile from "./pages/ProfilePage/Profile";
import BrowseUsers from "./pages/BrowseUsersPage/BrowseUsers";
import BrowseJobs from "./pages/BrowseJobsPage/BrowseJobs";
import CreateJob from "./pages/CreateJobPage/CreateJob";
import EditJob from "./pages/EditJobPage/EditJob";
import JobDetails from "./pages/JobDetailsPage/JobDetails";
import MyJobs from "./pages/MyJobsPage/MyJobs";
import MyApplications from "./pages/MyApplicationsPage/MyApplications";
import PostsFeed from "./pages/PostsFeedPage/PostsFeed";
import Connections from "./pages/ConnectionsPage/Connections";
import Notifications from "./pages/NotificationsPage/Notifications";
import Messages from "./pages/MessagesPage/Messages";
import ForgotPassword from "./pages/ForgotPasswordPage/ForgotPassword";
import ResetPassword from "./pages/ResetPasswordPage/ResetPassword";
import Search from "./pages/SearchPage/Search";
import GuestRoute from "./routes/GuestRoute";
import Navbar from "./components/Navbar";

const AppShell = () => {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const hideNavbar =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<PostsFeed />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<BrowseUsers />} />
          <Route path="/users/:userId" element={<Profile />} />
          <Route path="/jobs" element={<BrowseJobs />} />
          <Route path="/jobs/create" element={<CreateJob />} />
          <Route path="/jobs/my-jobs" element={<MyJobs />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
          <Route path="/jobs/:jobId/edit" element={<EditJob />} />
          <Route path="/applications/my-applications" element={<MyApplications />} />
          <Route
            path="/Login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/Register"
            element={
              <GuestRoute>
                <Register />
              </GuestRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            }
          />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
