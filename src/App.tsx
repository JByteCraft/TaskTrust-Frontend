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
import JobDetails from "./pages/JobDetailsPage/JobDetails";
import MyJobs from "./pages/MyJobsPage/MyJobs";
import MyApplications from "./pages/MyApplicationsPage/MyApplications";
import GuestRoute from "./routes/GuestRoute";
import Navbar from "./components/Navbar";

const AppShell = () => {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();
  const hideNavbar = pathname === "/login" || pathname === "/register";

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/users" element={<BrowseUsers />} />
          <Route path="/users/:userId" element={<Profile />} />
          <Route path="/jobs" element={<BrowseJobs />} />
          <Route path="/jobs/create" element={<CreateJob />} />
          <Route path="/jobs/my-jobs" element={<MyJobs />} />
          <Route path="/jobs/:jobId" element={<JobDetails />} />
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
