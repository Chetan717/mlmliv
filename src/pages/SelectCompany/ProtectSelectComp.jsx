import { Navigate } from "react-router";
import { useAuth } from "../../Auth/AuthContext";
import {
  hasMlmProfileInStorage,
  hasSelectedCompanyInStorage,
} from "../../utils/companyStorage";

export default function ProtectSelectComp({ children }) {
  const { user, loading } = useAuth();
  const hasMlmProfile = hasMlmProfileInStorage();
  const hasSelectedCompany = hasSelectedCompanyInStorage();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (hasMlmProfile || hasSelectedCompany) {
    return <Navigate to="/" replace />;
  }

  return children;
}
